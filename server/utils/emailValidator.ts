/**
 * PERPLEXTA SECURITY - DISPOSABLE EMAIL DOMAIN REGISTRY
 * 
 * Specialized utility to prevent bot fraud and temporary identity creation.
 * Contains a high-performance hash set of known disposable and burner email providers.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'temp-mail.org',
  'guerrillamail.com',
  '10minutemail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'tempmail.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'mintemail.com',
  'mkt.com',
  'moakt.com',
  'temp-mail.ru',
  'crazymailing.com',
  'fake-mail.com',
  'disposable.com',
  'burnermail.io',
  'tempmailaddress.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'email-temp.com'
]);

/**
 * Checks if a given email belongs to a disposable or burner provider.
 * @param email The email address to validate.
 * @param extraBanned Optional array of additional domains to block.
 * @returns boolean True if the email is disposable.
 */
export function isDisposableEmail(email: string, extraBanned: string[] = []): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true; // Invalid format
  
  if (extraBanned.includes(domain)) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Validates email format and provider integrity.
 * @param email 
 * @param extraBanned
 * @returns { isValid: boolean; reason?: string }
 */
export function validateEmailProvider(email: string, extraBanned: string[] = []): { isValid: boolean; reason?: string } {
  if (isDisposableEmail(email, extraBanned)) {
    return { 
      isValid: false, 
      reason: 'DISPOSABLE_EMAIL_NOT_ALLOWED' 
    };
  }
  
  return { isValid: true };
}
