import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface KeySet {
  privateKeyPem: string;
  publicKeyPem: string;
  jwk: {
    kty: string;
    use: string;
    alg: string;
    kid: string;
    n: string;
    e: string;
    [key: string]: any;
  };
}

let keysCache: KeySet | null = null;

const DEFAULT_KEY_DIR = path.resolve(process.cwd(), 'keys');
const DEFAULT_PRIVATE_KEY_PATH = path.join(DEFAULT_KEY_DIR, 'private.pem');
const DEFAULT_PUBLIC_KEY_PATH = path.join(DEFAULT_KEY_DIR, 'public.pem');

/**
 * Loads static RS256 signing keys from static files or environment variables.
 * Never regenerates keys in volatile memory on every boot, and provides zero
 * insecure or incomplete dummy key fallbacks.
 */
export function getOrCreateSigningKeys(): KeySet {
  if (keysCache) {
    return keysCache;
  }

  let privateKeyPem = process.env.SIGNING_PRIVATE_KEY || '';
  let publicKeyPem = process.env.SIGNING_PUBLIC_KEY || '';

  const privateKeyPath = process.env.SIGNING_PRIVATE_KEY_PATH || DEFAULT_PRIVATE_KEY_PATH;
  const publicKeyPath = process.env.SIGNING_PUBLIC_KEY_PATH || DEFAULT_PUBLIC_KEY_PATH;

  // 1. If not provided via environment variables, read from static key files on disk
  if (!privateKeyPem && fs.existsSync(privateKeyPath)) {
    try {
      privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8').trim();
    } catch (err: any) {
      console.error(`[KeysUtil] Failed to read private key from ${privateKeyPath}:`, err.message);
    }
  }

  if (!publicKeyPem && fs.existsSync(publicKeyPath)) {
    try {
      publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8').trim();
    } catch (err: any) {
      console.error(`[KeysUtil] Failed to read public key from ${publicKeyPath}:`, err.message);
    }
  }

  // 2. If static files do not exist yet, initialize and persist static key files once
  if (!privateKeyPem || !publicKeyPem) {
    try {
      if (!fs.existsSync(DEFAULT_KEY_DIR)) {
        fs.mkdirSync(DEFAULT_KEY_DIR, { recursive: true, mode: 0o700 });
      }

      console.info('[KeysUtil] Static signing keys not found. Generating permanent static RSA 2048 keypair on disk...');
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      privateKeyPem = privateKey.trim();
      publicKeyPem = publicKey.trim();

      fs.writeFileSync(privateKeyPath, privateKeyPem, { mode: 0o600 });
      fs.writeFileSync(publicKeyPath, publicKeyPem, { mode: 0o644 });
      console.info(`[KeysUtil] Static keys persisted successfully to ${DEFAULT_KEY_DIR}.`);
    } catch (err: any) {
      console.error('[KeysUtil] Failed to initialize static RSA signing keys on disk:', err.message);
      throw new Error(`CRITICAL_SECURITY_FAILURE: Unable to load or persist static signing keys: ${err.message}`);
    }
  }

  // 3. Derive valid JWK from static public key
  try {
    const publicKeyObject = crypto.createPublicKey(publicKeyPem);
    const jwkExport = publicKeyObject.export({ format: 'jwk' }) as any;

    const jwk = {
      kty: jwkExport.kty || 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid: process.env.SIGNING_KEY_ID || 'perplexta-signing-key-1',
      n: jwkExport.n,
      e: jwkExport.e || 'AQAB'
    };

    if (!jwk.n) {
      throw new Error('Derived JWK modulus (n) is missing or incomplete.');
    }

    keysCache = {
      privateKeyPem,
      publicKeyPem,
      jwk
    };

    console.log('[KeysUtil] Static RS256 signing keys loaded and cached successfully.');
    return keysCache;
  } catch (error: any) {
    console.error('[KeysUtil] Fatal error processing static RSA keys:', error);
    throw new Error(`CRITICAL_SECURITY_FAILURE: Failed to process static RS256 keys: ${error.message}`);
  }
}
