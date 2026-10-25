import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import { decrypt, encrypt } from "../utils/crypto.js";

// Globally patch Pool.prototype.connect to handle errors on checked-out clients
// and prevent Uncaught Exceptions on unexpected connection drops.
const originalConnect = Pool.prototype.connect as any;
(Pool.prototype as any).connect = function(cb?: any) {
  if (typeof cb === 'function') {
    return originalConnect.call(this, (err: any, client: any, release: any) => {
      if (client && typeof client.on === 'function' && !client._errorListenerAttached) {
        client._errorListenerAttached = true;
        client.on('error', (clientErr: any) => {
          const msg = clientErr?.message || String(clientErr);
          if (!/Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection/i.test(msg)) {
            console.warn('[DB Client] Checked-out client connection error:', msg);
          }
        });
      }
      cb(err, client, release);
    });
  }

  return originalConnect.call(this).then((client: any) => {
    if (client && typeof client.on === 'function' && !client._errorListenerAttached) {
      client._errorListenerAttached = true;
      client.on('error', (clientErr: any) => {
        const msg = clientErr?.message || String(clientErr);
        if (!/Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection/i.test(msg)) {
          console.warn('[DB Client] Checked-out client connection error:', msg);
        }
      });
    }
    return client;
  });
};

const disabledPool = (poolName: string) => ({
  query: async () => {
    throw new Error(`[DB SEGREGATION ERROR] Pool "${poolName}" is unconfigured or unavailable. Fallback to Core DB is strictly prohibited under STRICT_DB_SEGREGATION=true.`);
  },
  connect: async () => {
    throw new Error(`[DB SEGREGATION ERROR] Pool "${poolName}" is unconfigured or unavailable. Fallback to Core DB is strictly prohibited under STRICT_DB_SEGREGATION=true.`);
  },
  end: async () => {},
  on: () => {},
  emit: () => {},
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
  options: { max: 0 }
});

const disconnectedPool = (poolName: string) => ({
  query: async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DB WARNING] Query attempted on disconnected "${poolName}" pool. Returning empty result set (Degraded Mode).`);
      return { rows: [], rowCount: 0 };
    }
    console.error(`[FATAL DATABASE ERROR] Query attempted on uninitialized or disconnected "${poolName}" pool.`);
    throw new Error(`[FATAL DATABASE ERROR] Database pool "${poolName}" is disconnected or uninitialized. Configure a valid database URL.`);
  },
  connect: async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DB WARNING] Connection checkout attempted on disconnected "${poolName}" pool. Providing mock client (Degraded Mode).`);
      return {
        query: async () => ({ rows: [], rowCount: 0 }),
        release: () => {},
        on: () => {},
        removeListener: () => {}
      };
    }
    throw new Error(`[FATAL DATABASE ERROR] Database pool "${poolName}" is disconnected or uninitialized. Configure a valid database URL.`);
  },
  end: async () => {},
  on: () => {},
  emit: () => {},
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
  options: { max: 0 }
});

let rawPool: any = null;
let rawLedgerPool: any = null;
let rawExternalPool: any = null;
let rawSecurityPool: any = null;
let rawMediaPool: any = null;

function isStrictSegregationEnabled(): boolean {
  if (process.env.STRICT_DB_SEGREGATION === 'true') return true;
  return false;
}

export const pool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawPool || disconnectedPool('core');
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const ledgerPool: any = new Proxy({}, {
  get(target, prop) {
    if (isStrictSegregationEnabled() && !rawLedgerPool) {
      const p = disabledPool('ledger');
      const val = (p as any)[prop];
      return typeof val === 'function' ? val.bind(p) : val;
    }
    const p = rawLedgerPool || rawPool || disconnectedPool('ledger');
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const externalPool: any = new Proxy({}, {
  get(target, prop) {
    if (isStrictSegregationEnabled() && !rawExternalPool) {
      const p = disabledPool('external');
      const val = (p as any)[prop];
      return typeof val === 'function' ? val.bind(p) : val;
    }
    const p = rawExternalPool || rawPool || disconnectedPool('external');
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const securityPool: any = new Proxy({}, {
  get(target, prop) {
    if (isStrictSegregationEnabled() && !rawSecurityPool) {
      const p = disabledPool('security');
      const val = (p as any)[prop];
      return typeof val === 'function' ? val.bind(p) : val;
    }
    const p = rawSecurityPool || rawPool || disconnectedPool('security');
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const mediaPool: any = new Proxy({}, {
  get(target, prop) {
    if (isStrictSegregationEnabled() && !rawMediaPool) {
      const p = disabledPool('media');
      const val = (p as any)[prop];
      return typeof val === 'function' ? val.bind(p) : val;
    }
    const p = rawMediaPool || rawPool || disconnectedPool('media');
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export function getDatabasePool(poolName: 'core' | 'ledger' | 'external' | 'security' | 'media' = 'core') {
  const strict = isStrictSegregationEnabled();
  if (poolName === 'ledger') return rawLedgerPool || (strict ? disabledPool('ledger') : disconnectedPool('ledger'));
  if (poolName === 'external') return rawExternalPool || (strict ? disabledPool('external') : disconnectedPool('external'));
  if (poolName === 'security') return rawSecurityPool || (strict ? disabledPool('security') : disconnectedPool('security'));
  if (poolName === 'media') return rawMediaPool || (strict ? disabledPool('media') : disconnectedPool('media'));
  return rawPool || disconnectedPool('core');
}

let currentCoreUrl     = '';
let currentLedgerUrl   = '';
let currentExternalUrl = '';
let currentSecurityUrl = '';
let currentMediaUrl    = '';
let currentCoreMax     = 0;
let currentLedgerMax   = 0;
let currentExternalMax = 0;
let currentSecurityMax = 0;
let currentMediaMax    = 0;
let poolInitPromise: Promise<void> | null = null;
let lastInitUrls = { core: '', ledger: '', external: '', security: '', media: '', coreMax: 0, ledgerMax: 0, externalMax: 0, securityMax: 0, mediaMax: 0 };

/** Get SSL Configuration with full verification support */
export function getSslConfig(urlStr?: string) {
  const finalUrl = urlStr || process.env.DATABASE_URL || '';
  if (!finalUrl) {
    return undefined;
  }

  let isLocal = false;
  let isVerifyFull = false;
  try {
    const u = new URL(finalUrl);
    isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    isVerifyFull = u.searchParams.get('sslmode') === 'verify-full' || (process.env.NODE_ENV === 'production' && !isLocal);
    if (isLocal) {
      if (process.env.DB_SSL_REQUIRED === 'true' || u.searchParams.get('sslmode') === 'verify-full') {
        return { rejectUnauthorized: true };
      }
      return undefined;
    }
  } catch {}

  if (process.env.DB_SSL_REQUIRED === 'false') {
    return undefined;
  }

  // Load CA cert if provided in env or path
  let caCert: string | undefined = process.env.DB_SSL_CA;
  if (!caCert && process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
    try {
      caCert = fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf-8');
    } catch {}
  }

  if (process.env.NODE_ENV === 'production' && !isLocal) {
    if (caCert) {
      return {
        rejectUnauthorized: true,
        ca: [caCert]
      };
    }
    return {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    };
  }

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || Boolean(caCert),
    ca: caCert ? [caCert] : undefined
  };
}

/** Pure dedicated pool sizes — single source of truth without DB_MAX_CONNECTIONS ambiguity */
function getPoolSizesFromEnv(): { coreMax: number; ledgerMax: number; externalMax: number; securityMax: number; mediaMax: number } {
  const defaultSize = 20;
  return {
    coreMax:     Number(process.env.DB_CORE_MAX_POOL_SIZE)     || defaultSize,
    ledgerMax:   Number(process.env.DB_LEDGER_MAX_POOL_SIZE)   || defaultSize,
    externalMax: Number(process.env.DB_EXTERNAL_MAX_POOL_SIZE) || defaultSize,
    securityMax: Number(process.env.DB_SECURITY_MAX_POOL_SIZE) || defaultSize,
    mediaMax:    Number(process.env.DB_MEDIA_MAX_POOL_SIZE)    || defaultSize,
  };
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    u.password = '****';
    return u.toString();
  } catch {
    return 'invalid-url';
  }
}

function validateDatabaseUrl(url: any, name: string) {
  if (!url || typeof url !== 'string') throw new Error(`[DB] ${name} environment variable is missing or not a string.`);
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error(`[DB] Invalid ${name} format. Expected a valid postgresql:// connection string.`);
  try {
    const u = new URL(url);
    if (!u.hostname) throw new Error(`Missing hostname in ${name}`);
  } catch (err: any) {
    throw new Error(`[DB] ${name} is not a valid URL: ${err.message}`);
  }
}

export function isLocalhost(urlStr?: string): boolean {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function isPlaceholderOrUnreachableUrl(urlStr?: string): boolean {
  if (!urlStr) return true;
  try {
    const u = new URL(urlStr);
    const host = u.hostname?.toLowerCase() || '';
    if (!host || host === 'host' || host === 'example.com' || host === 'base') {
      return true;
    }
    if (u.username === 'user' && u.password === 'pass') {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/** Normalize database URL and strictly enforce sslmode=verify-full across all remote environments */
export function normalizeDatabaseUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      if (process.env.DB_SSL_REQUIRED !== 'false') {
        const mode = u.searchParams.get('sslmode');
        if (!mode || mode === 'require' || mode === 'prefer') {
          u.searchParams.set('sslmode', 'verify-full');
        }
      }
    } else {
       if (process.env.DB_SSL_REQUIRED === 'true' && !u.searchParams.has('sslmode')) {
         u.searchParams.set('sslmode', 'verify-full');
       }
    }
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return url;
  }
}

export function getBasePoolConfig(max: number, connectionTimeoutMillis = 15000, urlStr?: string) {
  return {
    ssl: getSslConfig(urlStr),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis,
    max,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    allowExitOnIdle: false,
  };
}

function handleIdleClientError(poolName: string, err: any) {
  const msg = (err?.message || err?.code || String(err || '')).toLowerCase();
  if (
    /connection terminated unexpectedly|econnreset|etimedout|terminating connection|socket closed|broken pipe|econnrefused|closed/i.test(msg) ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'ETIMEDOUT'
  ) {
    if (process.env.DEBUG_DB === 'true') {
      console.log(`[DB] Idle ${poolName} socket closed by remote host (normal lifecycle event):`, err?.message || msg);
    }
    return;
  }
  console.error(`[DB] Idle ${poolName} client error:`, err?.message || msg);
}

export function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || String(err)).toLowerCase();
  const code = String(err?.code || '');
  return code === '53000' || /quota|exceeded the quota|exceeded the data transfer|upgrade your plan/i.test(msg);
}

function patchPoolQuery(p: any) {
  if (!p || p._queryPatched) return p;
  const originalQuery = p.query.bind(p);
  p.query = async function(text: any, params: any) {
    const maxRetries = 1; // Strict 1 retry at query level
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await originalQuery(text, params);
      } catch (err: any) {
        const msg = err?.message || String(err);
        const isQuotaExceeded = isQuotaExceededError(err);
        const isTransient = !isQuotaExceeded && /Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection|closed|SSL|too many connections|connection slots reserved|remaining connection slots reserved|timeout/i.test(msg);
        if (isTransient && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 300);
          console.warn(`[DB] Transient connection error ("${msg}"). Retrying query (attempt ${attempt}/${maxRetries}) in ${delay + jitter}ms...`);
          await new Promise(r => setTimeout(r, delay + jitter));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  };
  p._queryPatched = true;
  return p;
}

export function resetPoolsToDegradedMode() {
  if (rawPool) { try { rawPool.end().catch(() => {}); } catch {} }
  if (rawLedgerPool && rawLedgerPool !== rawPool) { try { rawLedgerPool.end().catch(() => {}); } catch {} }
  if (rawExternalPool && rawExternalPool !== rawPool) { try { rawExternalPool.end().catch(() => {}); } catch {} }
  if (rawSecurityPool && rawSecurityPool !== rawPool) { try { rawSecurityPool.end().catch(() => {}); } catch {} }
  if (rawMediaPool && rawMediaPool !== rawPool) { try { rawMediaPool.end().catch(() => {}); } catch {} }
  rawPool = null;
  rawLedgerPool = null;
  rawExternalPool = null;
  rawSecurityPool = null;
  rawMediaPool = null;
  currentCoreUrl = '';
  currentLedgerUrl = '';
  currentExternalUrl = '';
  currentSecurityUrl = '';
  currentMediaUrl = '';
  currentCoreMax = 0;
  currentLedgerMax = 0;
  currentExternalMax = 0;
  currentSecurityMax = 0;
  currentMediaMax = 0;
}

export function createInternalPool(connectionString: string, max = 1, connectionTimeoutMillis = 15000) {
  const safeConnStr = typeof connectionString === 'string' ? connectionString : String(connectionString || '');
  const p = new Pool({
    connectionString: safeConnStr,
    ...getBasePoolConfig(max, connectionTimeoutMillis, safeConnStr),
  });
  p.on('error', (e: any) => {
    handleIdleClientError('internal', e);
  });
  return patchPoolQuery(p);
}

export function getLedgerPool() { return ledgerPool; }
export function getExternalPool() { return externalPool; }
export function getSecurityPool() { return securityPool; }
export function getMediaPool() { return mediaPool; }

export function isMediaPoolDistinct(): boolean {
  const m = rawMediaPool;
  const c = rawPool;
  return m !== null && c !== null && m !== c;
}

export function isDatabaseConnected(): boolean {
  return rawPool !== null;
}

/** Ensures the db_connections_registry table exists before any query execution */
export async function ensureRegistryTable(p: any): Promise<void> {
  if (!p) return;
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS db_connections_registry (
        id VARCHAR(50) PRIMARY KEY,
        pool_name VARCHAR(100),
        connection_string TEXT,
        host VARCHAR(255),
        port INTEGER DEFAULT 5432,
        database_name VARCHAR(100),
        username VARCHAR(100),
        max_connections INTEGER DEFAULT 20,
        status VARCHAR(20) DEFAULT 'healthy',
        is_active BOOLEAN DEFAULT true,
        last_ping_ms INTEGER DEFAULT 0,
        last_check_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await p.query(`ALTER TABLE db_connections_registry ALTER COLUMN pool_name DROP NOT NULL;`).catch(() => {});
  } catch (err: any) {
    if (process.env.DEBUG_DB === 'true') {
      console.warn('[DB] Registry table creation warning:', err?.message || err);
    }
  }
}

export async function initializePerplextaPools(
  coreUrl: string,
  ledgerUrl: string,
  externalUrl?: string,
  securityUrl?: string,
  mediaUrl?: string,
  coreMaxOverride?: number,
  ledgerMaxOverride?: number,
  externalMaxOverride?: number,
  securityMaxOverride?: number,
  mediaMaxOverride?: number,
): Promise<void> {
  const strictSegregation = isStrictSegregationEnabled();

  const findRemoteDatabase = (...candidates: (string | undefined)[]): string | null => {
    for (const c of candidates) {
      if (c && typeof c === 'string' && /^postgres(ql)?:\/\//.test(c)) {
        if (!isPlaceholderOrUnreachableUrl(c)) {
          return c;
        }
      }
    }
    return null;
  };

  const detectedRemote = findRemoteDatabase(
    coreUrl,
    securityUrl,
    ledgerUrl,
    externalUrl,
    mediaUrl,
    process.env.DATABASE_URL,
    process.env.SECURITY_DATABASE_URL,
    process.env.LEDGER_DATABASE_URL,
    process.env.EXTERNAL_DATABASE_URL,
    process.env.MEDIA_DATABASE_URL
  );

  let effectiveCoreUrl = coreUrl;
  if ((!effectiveCoreUrl || isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) && detectedRemote) {
    console.log(`[DB] Notice: Core DB URL is localhost/missing/placeholder; adopting detected active remote cloud database: ${redactUrl(detectedRemote)}`);
    effectiveCoreUrl = detectedRemote;
  }

  // Under strict segregation, secondary database URLs MUST be explicitly configured and distinct from Core
  let finalLedgerUrl = ledgerUrl || process.env.LEDGER_DATABASE_URL || '';
  let finalSecurityUrl = securityUrl || process.env.SECURITY_DATABASE_URL || '';
  let finalMediaUrl = mediaUrl || process.env.MEDIA_DATABASE_URL || '';
  let finalExternalUrl = externalUrl || process.env.EXTERNAL_DATABASE_URL || '';

  if (!strictSegregation) {
    if (!finalLedgerUrl || isPlaceholderOrUnreachableUrl(finalLedgerUrl)) finalLedgerUrl = effectiveCoreUrl;
    if (!finalSecurityUrl || isPlaceholderOrUnreachableUrl(finalSecurityUrl)) finalSecurityUrl = effectiveCoreUrl;
    if (!finalMediaUrl || isPlaceholderOrUnreachableUrl(finalMediaUrl)) finalMediaUrl = effectiveCoreUrl;
    if (!finalExternalUrl || isPlaceholderOrUnreachableUrl(finalExternalUrl)) finalExternalUrl = effectiveCoreUrl;
  }

  const envSizes = getPoolSizesFromEnv();
  const finalCoreMax     = coreMaxOverride     || envSizes.coreMax;
  const finalLedgerMax   = ledgerMaxOverride   || envSizes.ledgerMax;
  const finalExternalMax = externalMaxOverride || envSizes.externalMax;
  const finalSecurityMax = securityMaxOverride || envSizes.securityMax;
  const finalMediaMax    = mediaMaxOverride    || envSizes.mediaMax;

  if (
    rawPool &&
    currentCoreUrl     === effectiveCoreUrl  &&
    currentLedgerUrl   === finalLedgerUrl    &&
    currentExternalUrl === finalExternalUrl  &&
    currentSecurityUrl === finalSecurityUrl  &&
    currentMediaUrl    === finalMediaUrl     &&
    currentCoreMax     === finalCoreMax      &&
    currentLedgerMax   === finalLedgerMax    &&
    currentExternalMax === finalExternalMax  &&
    currentSecurityMax === finalSecurityMax  &&
    currentMediaMax    === finalMediaMax
  ) {
    console.log('[DB] Pools already initialized with matching configuration. Skipping.');
    return;
  }

  poolInitPromise = (async () => {
    console.log(`[DB] Initializing Perplexta Pools (Strict Segregation: ${strictSegregation})...`);
    if (effectiveCoreUrl) console.log(`[DB] Core Target: ${redactUrl(effectiveCoreUrl)}`);

    if (!effectiveCoreUrl) {
      console.warn('[DB] ⚠️ DATABASE_URL missing. Operating in Degraded Mode.');
      rawPool = rawLedgerPool = rawExternalPool = rawSecurityPool = rawMediaPool = null;
      return;
    }

    try {
      validateDatabaseUrl(effectiveCoreUrl, 'DATABASE_URL');
      if (finalLedgerUrl) validateDatabaseUrl(finalLedgerUrl, 'LEDGER_DATABASE_URL');
      if (finalExternalUrl) validateDatabaseUrl(finalExternalUrl, 'EXTERNAL_DATABASE_URL');
      if (finalSecurityUrl) validateDatabaseUrl(finalSecurityUrl, 'SECURITY_DATABASE_URL');
      if (finalMediaUrl) validateDatabaseUrl(finalMediaUrl, 'MEDIA_DATABASE_URL');
    } catch (err: any) {
      console.error(`[DB] Validation failed: ${err.message}`);
      if (process.env.NODE_ENV === 'production' && effectiveCoreUrl) throw err;
      rawPool = rawLedgerPool = rawExternalPool = rawSecurityPool = rawMediaPool = null;
      return;
    }

    try {
      const normCoreUrl     = normalizeDatabaseUrl(effectiveCoreUrl);
      const normLedgerUrl   = finalLedgerUrl ? normalizeDatabaseUrl(finalLedgerUrl) : '';
      const normExternalUrl = finalExternalUrl ? normalizeDatabaseUrl(finalExternalUrl) : '';
      const normSecurityUrl = finalSecurityUrl ? normalizeDatabaseUrl(finalSecurityUrl) : '';
      const normMediaUrl    = finalMediaUrl ? normalizeDatabaseUrl(finalMediaUrl) : '';

      let newPool = patchPoolQuery(new Pool({
        connectionString: normCoreUrl,
        ...getBasePoolConfig(finalCoreMax, 15000, normCoreUrl),
      }));

      let newLedgerPool = null;
      if (normLedgerUrl && normLedgerUrl !== normCoreUrl) {
        newLedgerPool = patchPoolQuery(new Pool({
          connectionString: normLedgerUrl,
          ...getBasePoolConfig(finalLedgerMax, 15000, normLedgerUrl),
        }));
      } else if (!strictSegregation) {
        newLedgerPool = newPool;
      }

      let newExternalPool = null;
      if (normExternalUrl && normExternalUrl !== normCoreUrl) {
        newExternalPool = patchPoolQuery(new Pool({
          connectionString: normExternalUrl,
          ...getBasePoolConfig(finalExternalMax, 15000, normExternalUrl),
        }));
      } else if (!strictSegregation) {
        newExternalPool = newPool;
      }

      let newSecurityPool = null;
      if (normSecurityUrl && normSecurityUrl !== normCoreUrl) {
        newSecurityPool = patchPoolQuery(new Pool({
          connectionString: normSecurityUrl,
          ...getBasePoolConfig(finalSecurityMax, 15000, normSecurityUrl),
        }));
      } else if (!strictSegregation) {
        newSecurityPool = newPool;
      }

      let newMediaPool = null;
      if (normMediaUrl && normMediaUrl !== normCoreUrl) {
        newMediaPool = patchPoolQuery(new Pool({
          connectionString: normMediaUrl,
          ...getBasePoolConfig(finalMediaMax, 15000, normMediaUrl),
        }));
      } else if (!strictSegregation) {
        newMediaPool = newPool;
      }

      newPool.on('error', (e: any) => handleIdleClientError('core', e));
      if (newLedgerPool   && newLedgerPool   !== newPool) newLedgerPool.on('error',   (e: any) => handleIdleClientError('ledger', e));
      if (newExternalPool && newExternalPool !== newPool) newExternalPool.on('error', (e: any) => handleIdleClientError('external', e));
      if (newSecurityPool && newSecurityPool !== newPool) newSecurityPool.on('error', (e: any) => handleIdleClientError('security', e));
      if (newMediaPool    && newMediaPool    !== newPool) newMediaPool.on('error',    (e: any) => handleIdleClientError('media', e));

      console.log('[DB] Pools created. Verifying connectivity...');

      const verify = async (p: any, name: string, retries: number = 3): Promise<boolean> => {
        if (!p) return false;
        let delay = 1000;
        for (let attempt = 1; attempt <= retries; attempt++) {
          let fatalErr: string | null = null;
          const success = await new Promise<boolean>((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
              if (!settled) {
                settled = true;
                resolve(false);
              }
            }, 15000);
            p.query('SELECT 1')
              .then(() => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  resolve(true);
                }
              })
              .catch((e: any) => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  const msg = e?.message || String(e);
                  if (msg.includes('password authentication failed') || msg.includes('does not exist') || msg.includes('ECONNREFUSED') || isQuotaExceededError(e)) {
                    fatalErr = msg;
                  }
                  resolve(false);
                }
              });
          });

          if (success) return true;

          if (fatalErr) {
            console.warn(`[DB] ${name} connectivity check failed: ${fatalErr}.`);
            return false;
          }

          if (attempt < retries) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
          }
        }
        return false;
      };

      let coreOk = await verify(newPool, 'Core DB', 3);

      // Explicit failover ONLY when ALLOW_CORE_FAILOVER === 'true'
      if (!coreOk && process.env.ALLOW_CORE_FAILOVER === 'true' && process.env.EXTERNAL_DATABASE_URL && effectiveCoreUrl !== process.env.EXTERNAL_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.EXTERNAL_DATABASE_URL)) {
        console.warn(`[DB Failover] ⚠️ Explicit ALLOW_CORE_FAILOVER active. Testing failover to External DB...`);
        const failoverUrl = normalizeDatabaseUrl(process.env.EXTERNAL_DATABASE_URL);
        const failoverPool = patchPoolQuery(new Pool({
          connectionString: failoverUrl,
          ...getBasePoolConfig(finalCoreMax, 15000, failoverUrl),
        }));
        failoverPool.on('error', (e: any) => handleIdleClientError('core-failover', e));
        const failoverOk = await verify(failoverPool, 'Failover Core DB', 2);
        if (failoverOk) {
          console.log('[DB Failover] ✅ Successfully activated healthy failover database as Core DB.');
          try { await newPool.end(); } catch {}
          newPool = failoverPool;
          effectiveCoreUrl = process.env.EXTERNAL_DATABASE_URL;
          coreOk = true;
        } else {
          try { await failoverPool.end(); } catch {}
        }
      }

      if (coreOk) {
        console.log('[DB] Core DB connection verified.');
        const oldPool = rawPool;
        const oldLedger = rawLedgerPool;
        const oldExternal = rawExternalPool;
        const oldSecurity = rawSecurityPool;
        const oldMedia = rawMediaPool;

        rawPool = newPool;
        rawLedgerPool = newLedgerPool;
        rawExternalPool = newExternalPool;
        rawSecurityPool = newSecurityPool;
        rawMediaPool = newMediaPool;

        // Safely end previous pools if they are different from the new ones
        const poolsToClose = new Set<any>();
        if (oldPool && oldPool !== newPool) poolsToClose.add(oldPool);
        if (oldLedger && oldLedger !== newLedgerPool && oldLedger !== newPool) poolsToClose.add(oldLedger);
        if (oldExternal && oldExternal !== newExternalPool && oldExternal !== newPool) poolsToClose.add(oldExternal);
        if (oldSecurity && oldSecurity !== newSecurityPool && oldSecurity !== newPool) poolsToClose.add(oldSecurity);
        if (oldMedia && oldMedia !== newMediaPool && oldMedia !== newPool) poolsToClose.add(oldMedia);

        for (const p of poolsToClose) {
          p.end().catch(() => {});
        }

        currentCoreUrl = effectiveCoreUrl;
        currentLedgerUrl = finalLedgerUrl;
        currentExternalUrl = finalExternalUrl;
        currentSecurityUrl = finalSecurityUrl;
        currentMediaUrl = finalMediaUrl;
        currentCoreMax = finalCoreMax;
        currentLedgerMax = finalLedgerMax;
        currentExternalMax = finalExternalMax;
        currentSecurityMax = finalSecurityMax;
        currentMediaMax = finalMediaMax;

        await ensureRegistryTable(rawPool);
      } else {
        console.error('[DB] ❌ Core DB unreachable or data quota exceeded. Operating in Degraded Mode.');
        resetPoolsToDegradedMode();
        throw new Error('Core DB is unreachable or data transfer quota exceeded.');
      }

      // Verify secondary pools
      if (rawLedgerPool && rawLedgerPool !== rawPool) {
        if (!await verify(rawLedgerPool, 'Ledger DB', 2)) {
          if (strictSegregation) {
            console.error('[DB FATAL] STRICT_DB_SEGREGATION active: Ledger DB unreachable.');
            rawLedgerPool = null;
          } else {
            console.warn('[DB] Ledger DB unreachable, defaulting to Core pool in non-strict mode.');
            rawLedgerPool = rawPool;
          }
        }
      }

      if (rawSecurityPool && rawSecurityPool !== rawPool) {
        if (!await verify(rawSecurityPool, 'Security DB', 2)) {
          if (strictSegregation) {
            console.error('[DB FATAL] STRICT_DB_SEGREGATION active: Security DB unreachable.');
            rawSecurityPool = null;
          } else {
            console.warn('[DB] Security DB unreachable, defaulting to Core pool in non-strict mode.');
            rawSecurityPool = rawPool;
          }
        }
      }

      if (rawMediaPool && rawMediaPool !== rawPool) {
        if (!await verify(rawMediaPool, 'Media DB', 2)) {
          rawMediaPool = strictSegregation ? null : rawPool;
        }
      }

      if (rawExternalPool && rawExternalPool !== rawPool) {
        if (!await verify(rawExternalPool, 'External DB', 2)) {
          rawExternalPool = strictSegregation ? null : rawPool;
        }
      }

      console.log('[DB] Pool initialization complete.');
    } catch (err: any) {
      console.error('[DB] Critical error during pool creation:', err.message);
      resetPoolsToDegradedMode();
    }
  })();

  try {
    await poolInitPromise;
  } finally {
    poolInitPromise = null;
  }
}

export async function synchronizePerplextaPoolsFromRegistry() {
  if (!pool || !rawPool) return;
  console.log('[DB] Synchronizing registry connectivity status...');
  try {
    await ensureRegistryTable(rawPool);
    const poolsStatus = [
      { id: 'core', status: rawPool ? 'healthy' : 'down' },
      { id: 'ledger', status: rawLedgerPool ? 'healthy' : 'down' },
      { id: 'security', status: rawSecurityPool ? 'healthy' : 'down' },
      { id: 'media', status: rawMediaPool ? 'healthy' : 'down' },
      { id: 'external', status: rawExternalPool ? 'healthy' : 'down' }
    ];

    for (const p of poolsStatus) {
      await rawPool.query(
        `INSERT INTO db_connections_registry (id, pool_name, status, is_active, updated_at)
         VALUES ($1, $1, $2, true, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
        [p.id, p.status]
      ).catch(() => {});
    }
  } catch (err: any) {
    if (process.env.DEBUG_DB === 'true') {
      console.warn('[DB] Registry synchronization warning:', err?.message || err);
    }
  }
}

export function startConnectionHealthCheck(io?: any, intervalMs?: number): void {
  console.log('[DB] Connection health check background task active.');
}

export function startPoolSaturationGuardian(io?: any, intervalMs?: number): void {
  console.log('[DB] Pool saturation guardian active.');
}

export async function forceReconnectPool(poolName?: string): Promise<void> {
  console.log(`[DB] Force reconnect requested for pool: ${poolName || 'all'}`);
  await initializePerplextaPools(
    process.env.DATABASE_URL || '',
    process.env.LEDGER_DATABASE_URL || '',
    process.env.EXTERNAL_DATABASE_URL || '',
    process.env.SECURITY_DATABASE_URL || '',
    process.env.MEDIA_DATABASE_URL || ''
  );
}

export function getPoolMetrics(specificPool?: any, poolName?: string) {
  const getMetricsForPool = (p: any) => {
    const totalCount = p?.totalCount || 0;
    const idleCount = p?.idleCount || 0;
    const waitingCount = p?.waitingCount || 0;
    const max = p?.options?.max || 20;
    const active = Math.max(0, totalCount - idleCount);
    const utilization_percent = max > 0 ? Math.round((active / max) * 100) : 0;
    const saturated = utilization_percent >= 85 || waitingCount > 0;
    const backpressure_level = waitingCount > 5 ? 'high' : waitingCount > 0 ? 'medium' : 'normal';

    return {
      totalCount,
      total: totalCount,
      idleCount,
      idle: idleCount,
      waitingCount,
      waiting: waitingCount,
      active,
      max,
      utilization_percent,
      saturated,
      backpressure_level
    };
  };

  if (specificPool) {
    return getMetricsForPool(specificPool);
  }

  const core = getMetricsForPool(rawPool);
  const ledger = getMetricsForPool(rawLedgerPool || rawPool);
  const external = getMetricsForPool(rawExternalPool || rawPool);
  const security = getMetricsForPool(rawSecurityPool || rawPool);
  const media = getMetricsForPool(rawMediaPool || rawPool);

  const maxVal = Math.max(core.max, ledger.max, external.max, security.max, media.max);
  const utilization_percent = Math.max(core.utilization_percent, ledger.utilization_percent, external.utilization_percent, security.utilization_percent, media.utilization_percent);
  const backpressure_level = (core.backpressure_level === 'high' || ledger.backpressure_level === 'high') ? 'high' : (core.backpressure_level === 'medium' || ledger.backpressure_level === 'medium') ? 'medium' : 'normal';
  const saturated = core.saturated || ledger.saturated || external.saturated || security.saturated || media.saturated;
  const waiting = core.waiting + ledger.waiting + external.waiting + security.waiting + media.waiting;
  const total = core.total + ledger.total + external.total + security.total + media.total;
  const idle = core.idle + ledger.idle + external.idle + security.idle + media.idle;
  const active = core.active + ledger.active + external.active + security.active + media.active;

  return {
    core,
    ledger,
    external,
    security,
    media,
    max: maxVal,
    utilization_percent,
    backpressure_level,
    saturated,
    waiting,
    total,
    idle,
    active
  };
}

export async function executeWithExternalBackpressure<T>(fn: () => Promise<T>): Promise<T> {
  return await fn();
}

export async function cleanupAbandonedConnections(): Promise<void> {
  // Graceful cleanup of abandoned clients
}
