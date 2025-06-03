import { CustomerProfile } from '../types';

interface CacheEntry {
  profile: CustomerProfile;
  timestamp: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  cacheSize: number;
  hitRate: number;
}

class Customer360CacheService {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50; // Maximum number of profiles to cache
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes cache expiry
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    cacheSize: 0,
    hitRate: 0
  };

  /**
   * Get a customer profile from cache
   */
  get(email: string): CustomerProfile | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(email.toLowerCase());
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      console.log(`🔍 Cache miss for ${email}`);
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiryMs) {
      console.log(`⏰ Cache expired for ${email}`);
      this.cache.delete(email.toLowerCase());
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();
    
    console.log(`✅ Cache hit for ${email} (age: ${Math.round((now - entry.timestamp) / 1000)}s)`);
    return entry.profile;
  }

  /**
   * Store a customer profile in cache
   */
  set(email: string, profile: CustomerProfile): void {
    const now = Date.now();
    const key = email.toLowerCase();

    // If cache is at max size, remove least recently used entries
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      profile,
      timestamp: now,
      lastAccessed: now
    });

    this.stats.cacheSize = this.cache.size;
    console.log(`💾 Cached profile for ${email} (cache size: ${this.cache.size})`);
  }

  /**
   * Check if a profile exists in cache and is not expired
   */
  has(email: string): boolean {
    const entry = this.cache.get(email.toLowerCase());
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiryMs) {
      this.cache.delete(email.toLowerCase());
      return false;
    }

    return true;
  }

  /**
   * Invalidate cache entry for a specific email
   */
  invalidate(email: string): void {
    const key = email.toLowerCase();
    if (this.cache.delete(key)) {
      console.log(`🗑️ Invalidated cache for ${email}`);
      this.stats.cacheSize = this.cache.size;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.cacheSize = 0;
    console.log(`🧹 Cleared entire cache (${size} entries removed)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Prefetch profiles for a list of emails (background loading)
   */
  async prefetch(emails: string[], fetchFunction: (email: string) => Promise<CustomerProfile | null>): Promise<void> {
    console.log(`🔄 Prefetching ${emails.length} customer profiles...`);
    
    const uncachedEmails = emails.filter(email => !this.has(email));
    
    if (uncachedEmails.length === 0) {
      console.log(`✅ All profiles already cached`);
      return;
    }

    console.log(`📥 Prefetching ${uncachedEmails.length} missing profiles`);

    // Fetch profiles in parallel but with some rate limiting
    const batchSize = 3;
    for (let i = 0; i < uncachedEmails.length; i += batchSize) {
      const batch = uncachedEmails.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (email) => {
          try {
            const profile = await fetchFunction(email);
            if (profile) {
              this.set(email, profile);
            }
          } catch (error) {
            console.error(`❌ Failed to prefetch profile for ${email}:`, error);
          }
        })
      );

      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < uncachedEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Prefetch completed`);
  }

  /**
   * Update a cached profile (useful when editing contact info)
   */
  update(email: string, updates: Partial<CustomerProfile>): void {
    const key = email.toLowerCase();
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.profile = { ...entry.profile, ...updates };
      entry.lastAccessed = Date.now();
      console.log(`🔄 Updated cached profile for ${email}`);
    }
  }

  /**
   * Get all cached email addresses
   */
  getCachedEmails(): string[] {
    return Array.from(this.cache.keys());
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let oldestEntry: { key: string; lastAccessed: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = { key, lastAccessed: entry.lastAccessed };
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry.key);
      console.log(`🗑️ Evicted LRU entry: ${oldestEntry.key}`);
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    this.stats.cacheSize = this.cache.size;
  }
}

export const customer360Cache = new Customer360CacheService(); 