import { Email, MailboxFolder } from '../hooks/useProgressiveMailbox';

interface MailboxCache {
  emails: Email[];
  folders: MailboxFolder[];
  lastFetch: number;
  isInitialized: boolean;
}

// Global in-memory cache that persists across component unmounts
let globalCache: MailboxCache = {
  emails: [],
  folders: [],
  lastFetch: 0,
  isInitialized: false
};

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export const mailboxCache = {
  // Get cached data if still valid
  get(): MailboxCache | null {
    const now = Date.now();
    if (globalCache.isInitialized && (now - globalCache.lastFetch) < CACHE_TTL) {
      console.log('📦 Using in-memory cache (age:', Math.round((now - globalCache.lastFetch) / 1000), 'seconds)');
      return globalCache;
    }
    return null;
  },

  // Update cache
  set(emails: Email[], folders: MailboxFolder[]) {
    globalCache = {
      emails,
      folders,
      lastFetch: Date.now(),
      isInitialized: true
    };
    console.log('💾 Updated in-memory cache with', emails.length, 'emails and', folders.length, 'folders');
  },

  // Clear cache
  clear() {
    globalCache = {
      emails: [],
      folders: [],
      lastFetch: 0,
      isInitialized: false
    };
    console.log('🗑️ Cleared in-memory cache');
  },

  // Check if cache is valid
  isValid(): boolean {
    const now = Date.now();
    return globalCache.isInitialized && (now - globalCache.lastFetch) < CACHE_TTL;
  }
}; 