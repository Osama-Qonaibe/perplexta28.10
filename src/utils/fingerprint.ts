/**
 * PERPLEXTA SOVEREIGN FINGERPRINTING UTILITY
 * 
 * Generates and persists a unique visitor identity to detect multi-account fraud
 * and link guest sessions to registered identities.
 */

import { v4 as uuidv4 } from 'uuid';

const FINGERPRINT_KEY = 'perplexta_visitor_id';

/**
 * Retrieves the existing visitor ID from storage or generates a new one.
 * @returns string The persistent visitor identity.
 */
export function getVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(FINGERPRINT_KEY);
    
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem(FINGERPRINT_KEY, visitorId);
    }
    
    return visitorId;
  } catch {
    // Fallback for private browsing / blocked storage
    return 'anon-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Attaches the visitor ID to a request payload if it exists.
 */
export function withFingerprint<T extends object>(payload: T): T & { visitor_id: string } {
  return {
    ...payload,
    visitor_id: getVisitorId()
  };
}
