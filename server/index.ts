import './bootstrapEnv.js';
import fs from 'fs';
import './utils/validateSecrets.js'; // Auto-validates secrets on import
import { createServer } from 'http';

const TRANSIENT_NETWORK_ERRORS = ['EPIPE', 'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ECANCELED', 'ERR_STREAM_PREMATURE_CLOSE'];

function isTransientNetworkError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = err.message || '';
  return TRANSIENT_NETWORK_ERRORS.some(k => code === k || msg.includes(k));
}

process.on('uncaughtException', (err: any) => {
  if (isTransientNetworkError(err)) {
    console.info('[Process] Handled transient network stream disconnection gracefully:', err?.message || err);
    return;
  }
  console.error('[Process] Uncaught Exception:', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  if (isTransientNetworkError(reason)) {
    console.info('[Process] Handled transient unhandled rejection gracefully:', reason?.message || reason);
    return;
  }
  console.error('[Process] Unhandled Promise Rejection:', reason?.message || reason);
});

import app, { ensureApiPerfLogsTable } from './app.js';
import { initSocket } from './config/socket.js';
import { initializePerplextaPools, synchronizePerplextaPoolsFromRegistry, startConnectionHealthCheck, startPoolSaturationGuardian, isDatabaseConnected, pool } from './db/index.js';
import { createServer as createViteServer } from 'vite';
import { runDatabaseMigrations, setIo } from './db/migrations.js';
import { ensureDatabaseTables } from './services/database-initializer.js';
import { syncSystemTemplates } from './services/email.js';
import { refreshCachedAppName } from './services/system.js';
import { initializeSystemAssetSuite } from './services/systemAssetManager.js';
import { ensureAdsSeedData } from './routes/ads.js';
import { ensureBulletinSeedData } from './routes/bulletin.js';
import { initCronJobs } from './jobs/cron.js';
import { initUploadsMonitor } from './services/uploadsMonitorService.js';
import { connectCache } from './utils/cache.js';
import { warmupSeoAndSystemCache } from './db/queries.js';

const PORT = 3000;
const MAX_DB_ATTEMPTS = 3;
const DB_RETRY_DELAY_MS = 3_000;

let isMigrationsComplete = false;
let migrationsPromise: Promise<boolean> | null = null;

// Complete Migration Readiness Gateway:
// Blocks ALL incoming traffic (pages, static bundles, and APIs except /api/health)
// until migrations and schema verifications are 100% completed.
app.use(async (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  if (!isMigrationsComplete && migrationsPromise) {
    try {
      await migrationsPromise;
    } catch {}
  }
  next();
});

/**
 * Runs a seed/initialization task once across application restarts by persisting
 * execution version tags into the seed_executions table.
 * Strictly prevents execution if database is disconnected (ZERO in-memory fallback).
 */
async function runSeedOnce(seedKey: string, seedFn: () => Promise<void>): Promise<void> {
  if (!isDatabaseConnected() || !pool) {
    console.warn(`[Seed] Database is disconnected. Skipping seed task "${seedKey}". Zero fallback execution.`);
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seed_executions (
        id VARCHAR(100) PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const check = await pool.query('SELECT id FROM seed_executions WHERE id = $1', [seedKey]);
    if (check.rows.length === 0) {
      console.log(`[Seed] Executing startup task "${seedKey}"...`);
      await seedFn();
      await pool.query('INSERT INTO seed_executions (id) VALUES ($1) ON CONFLICT DO NOTHING', [seedKey]);
    } else {
      if (process.env.DEBUG_DB === 'true') {
        console.log(`[Seed] Startup task "${seedKey}" already completed. Skipping.`);
      }
    }
  } catch (err: any) {
    console.warn(`[Seed] Notice during startup task "${seedKey}":`, err?.message || err);
  }
}

/**
 * Attempts to initialise DB pools, run migrations, and execute single-run seeds.
 */
async function initDatabaseAndMigrations(): Promise<boolean> {
  const coreUrl = process.env.DATABASE_URL?.trim();
  if (!coreUrl) {
    console.log('[Server] Operating in Degraded Mode (no DATABASE_URL configured). Safe in-memory fallbacks active.');
    isMigrationsComplete = true;
    return false;
  }

  for (let attempt = 1; attempt <= MAX_DB_ATTEMPTS; attempt++) {
    try {
      await initializePerplextaPools(
        coreUrl,
        process.env.LEDGER_DATABASE_URL  || '',
        process.env.EXTERNAL_DATABASE_URL || '',
        process.env.SECURITY_DATABASE_URL || '',
        process.env.MEDIA_DATABASE_URL   || ''
      );
      if (!isDatabaseConnected()) {
        throw new Error('Database connection could not be established.');
      }
      await synchronizePerplextaPoolsFromRegistry();

      // 1. Run migrations before opening any traffic to callers
      console.log('[Server] Executing database migrations and schema checks...');
      await runDatabaseMigrations();
      await ensureDatabaseTables();

      // 2. Execute seeds and startup caches once via seed_executions tracking
      await runSeedOnce('v1_email_templates_seed', syncSystemTemplates);
      await runSeedOnce('v1_ads_seed', ensureAdsSeedData);
      await runSeedOnce('v1_bulletin_seed', ensureBulletinSeedData);
      await runSeedOnce('v1_app_name_seed', refreshCachedAppName);
      await runSeedOnce('v1_system_assets_seed', initializeSystemAssetSuite);
      await runSeedOnce('v1_api_perf_logs_table', ensureApiPerfLogsTable);
      await runSeedOnce('v1_seo_cache_warmup', warmupSeoAndSystemCache);

      isMigrationsComplete = true;
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.stack || err.message : String(err);
      const isConnectionError = msg.includes('ECONNREFUSED') || msg.includes('timeout') || msg.includes('connection');
      const logType = isConnectionError ? 'CONNECTION_FAILURE' : 'SCHEMA_VALIDATION_ERROR';
      
      if (attempt < MAX_DB_ATTEMPTS) {
        console.warn(`[Server] DB Init Attempt ${attempt}/${MAX_DB_ATTEMPTS} failed [${logType}]: ${msg}. Retrying in ${DB_RETRY_DELAY_MS / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, DB_RETRY_DELAY_MS));
      } else {
        console.warn(`[Server] CRITICAL: All DB init attempts exhausted [${logType}] (${msg}). Operating in resilient Degraded Mode.`);
      }
    }
  }
  isMigrationsComplete = true;
  return false;
}

async function startServer() {
  try {
    console.log('[Server] Initializing Perplexta Ecosystem...');

    // 1. Connect cache
    await connectCache();

    // 2. Integrate Vite Dev Middleware if in development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
      });
      app.locals.vite = vite;
      app.use(vite.middlewares);
      console.log('[Server] Vite Middleware integrated (Dev Mode, HMR disabled)');
    }

    // 3. Create HTTP Server & Socket.io
    const httpServer = createServer(app);
    const ioInstance = initSocket(httpServer);
    setIo(ioInstance);

    const shutdown = (signal: string) => {
      console.log(`[Server] ${signal} received — shutting down gracefully...`);
      httpServer.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Handle listen errors gracefully (prevent unhandled EADDRINUSE crash during process handover)
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Server] Port ${PORT} busy during pre-warm/startup, retrying in 1s...`);
        setTimeout(() => {
          try {
            httpServer.close();
            httpServer.listen(PORT, '0.0.0.0');
          } catch {}
        }, 1000);
      } else {
        console.error('[Server] HTTP server listen error:', err);
      }
    });

    // 4. Start listening on port 3000 immediately so supervisor and health checks succeed
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] 🚀 Perplexta Engine active on port ${PORT} [READY]`);
    });

    // 5. Kick off migrations & database preparation; all incoming pages/static/APIs await this via gateway
    migrationsPromise = initDatabaseAndMigrations();
    migrationsPromise
      .then(async (dbReady) => {
        if (dbReady) {
          console.log('[Server] Database initialization & migrations completed successfully.');

          // Cooldown delay (5s) to eliminate startup CPU/DB saturation
          const COOLDOWN_DELAY_MS = 5_000;
          setTimeout(async () => {
            console.log('[Server] Cooldown period ended. Activating background cron jobs, health checks, and guardians...');
            initCronJobs();
            startConnectionHealthCheck();
            startPoolSaturationGuardian();
            try {
              const { startAutomatedGpuDiscovery } = await import('./services/gpu/gpuDiscoveryService.js');
              startAutomatedGpuDiscovery();
            } catch (gpuDiscErr: any) {
              console.warn('[Server] GPU Discovery initialization warning:', gpuDiscErr.message);
            }
            console.log('[Server] Secondary background guardians & cron tasks initialized successfully.');
          }, COOLDOWN_DELAY_MS);
        } else {
          console.log('[Server] Loaded Engine in Degraded Mode (no persistent DB connectivity).');
        }
      })
      .catch((err) => {
        console.error('[Server] Non-fatal error during database initialization:', err);
      })
      .finally(() => {
        initUploadsMonitor();
      });

  } catch (err) {
    console.error('[Server] FATAL: Unexpected Application Failure:', err);
    process.exit(1);
  }
}

startServer();
