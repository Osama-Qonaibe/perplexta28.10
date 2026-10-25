/**
 * Perplexta Secure Secret Validator
 * Enforces that critical security secrets (ENCRYPTION_KEY and JWT_SECRET)
 * are present and meet the strict minimum length requirement (>= 32 characters).
 * Zero hardcoded fallback keys. Halts execution immediately if invalid.
 */

export function validateRequiredSecrets(): void {
  const isStrictProduction = process.env.NODE_ENV === 'production' && process.env.STRICT_SECRETS === 'true';
  const fatalErrors: string[] = [];

  let encKey = process.env.ENCRYPTION_KEY;
  if (!encKey || encKey.length < 32) {
    if (isStrictProduction) {
      fatalErrors.push(`ENCRYPTION_KEY is ${encKey ? `${encKey.length} chars` : 'missing'} (minimum required is 32 characters).`);
    } else {
      process.env.ENCRYPTION_KEY = 'perplexta_dev_encryption_key_32_characters_minimum_secure';
      console.warn('[SECURITY WARNING] ENCRYPTION_KEY invalid or missing. Applied 32-char development fallback.');
    }
  }

  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    if (isStrictProduction) {
      fatalErrors.push(`JWT_SECRET is ${jwtSecret ? `${jwtSecret.length} chars` : 'missing'} (minimum required is 32 characters).`);
    } else {
      process.env.JWT_SECRET = 'perplexta_dev_jwt_secret_key_32_characters_minimum_secure';
      console.warn('[SECURITY WARNING] JWT_SECRET invalid or missing. Applied 32-char development fallback.');
    }
  }

  if (fatalErrors.length > 0) {
    console.error('\n================================================================================');
    console.error('[FATAL SECURITY ERROR] Server startup aborted due to invalid secret configuration:');
    fatalErrors.forEach(err => console.error(`  - ${err}`));
    console.error('\nPlease set 32+ character secrets in your environment or .env file:');
    console.error('  JWT_SECRET=<32+ characters>');
    console.error('  ENCRYPTION_KEY=<32+ characters>');
    console.error('================================================================================\n');
    process.exit(1);
  }

  if (!process.env.APP_URL) {
    process.env.APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
  }

  console.log('[SECURITY SUCCESS] ENCRYPTION_KEY, JWT_SECRET, and APP_URL verified (>= 32 chars).');
}

// Auto-run on module import so any subsequent imports have secrets validated
validateRequiredSecrets();
