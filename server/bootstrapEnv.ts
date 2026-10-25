import { loadEnvFile } from 'node:process';
import fs from 'node:fs';

const vpsEnv = '/home/perplexta1/public_html/.env';

function parseAndLoadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      if (key && val) {
        if (!process.env[key] || (process.env[key]!.length < 32 && val.length >= 32)) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

// Clean up pre-existing dummy short secrets (<32 chars) so valid .env secrets or fallbacks apply
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  delete process.env.JWT_SECRET;
}
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
  delete process.env.ENCRYPTION_KEY;
}

try {
  if (fs.existsSync(vpsEnv)) {
    parseAndLoadEnv(vpsEnv);
  } else if (fs.existsSync('.env')) {
    parseAndLoadEnv('.env');
  }
} catch {
  // Graceful fallback if already injected or non-existent in current runner
}
