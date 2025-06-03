import { useState, useEffect, useCallback } from 'react';
import { CustomerProfile } from '../types';
import { customer360OptimizedService } from '../services/Customer360OptimizedService';
import { customer360Cache } from '../services/Customer360CacheService';

interface UseCustomer360CacheResult {
  customerProfile: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
    cacheSize: number;
  };
  refreshProfile: () => Promise<void>;
  invalidateCache: () => void;
}

export function useCustomer360Cache(customerEmail: string): UseCustomer360CacheResult {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const loadCustomerProfile = useCallback(async (forceRefresh = false) => {
    if (!customerEmail) {
      setError('No customer email provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        console.log(`🔍 Checking cache for ${customerEmail}...`);
        const cachedProfile = customer360Cache.get(customerEmail);
        
        if (cachedProfile) {
          console.log(`⚡ Using cached profile for ${customerEmail}`);
          setCustomerProfile(cachedProfile);
          setIsFromCache(true);
          setIsLoading(false);
          
          // Background refresh if cache is getting old (older than 2 minutes)
          const cacheAge = Date.now() - (customer360Cache as any).cache.get(customerEmail.toLowerCase())?.timestamp || 0;
          if (cacheAge > 2 * 60 * 1000) {
            console.log(`🔄 Background refresh for ${customerEmail} (cache age: ${Math.round(cacheAge / 1000)}s)`);
                      // Background refresh without affecting UI
          customer360OptimizedService.getCustomerProfile(customerEmail).then(freshProfile => {
              if (freshProfile) {
                customer360Cache.set(customerEmail, freshProfile);
                setCustomerProfile(freshProfile);
                console.log(`✅ Background refresh completed for ${customerEmail}`);
              }
            }).catch(err => {
              console.warn(`⚠️ Background refresh failed for ${customerEmail}:`, err);
            });
          }
          return;
        }
      }

      // Cache miss or forced refresh - fetch from service
      console.log(`📡 Fetching fresh profile for ${customerEmail}...`);
      setIsFromCache(false);
      
      const profile = await customer360OptimizedService.getCustomerProfile(customerEmail);
      
      if (profile) {
        // Cache the fresh profile
        customer360Cache.set(customerEmail, profile);
        setCustomerProfile(profile);
        console.log(`✅ Fresh profile loaded and cached for ${customerEmail}`);
      } else {
        setError('Customer profile not found');
      }
    } catch (err) {
      console.error(`❌ Error loading customer profile for ${customerEmail}:`, err);
      setError('Failed to load customer profile');
      
      // If fresh fetch failed, try to use expired cache as fallback
      const fallbackProfile = (customer360Cache as any).cache.get(customerEmail.toLowerCase())?.profile;
      if (fallbackProfile) {
        console.log(`🔄 Using expired cache as fallback for ${customerEmail}`);
        setCustomerProfile(fallbackProfile);
        setIsFromCache(true);
        setError('Using cached data (network error)');
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerEmail]);

  const refreshProfile = useCallback(async () => {
    console.log(`🔄 Force refreshing profile for ${customerEmail}`);
    await loadCustomerProfile(true);
  }, [customerEmail, loadCustomerProfile]);

  const invalidateCache = useCallback(() => {
    console.log(`🗑️ Invalidating cache for ${customerEmail}`);
    customer360Cache.invalidate(customerEmail);
  }, [customerEmail]);

  // Load profile when email changes
  useEffect(() => {
    if (customerEmail) {
      console.log(`🎯 useCustomer360Cache: Loading profile for ${customerEmail}`);
      loadCustomerProfile();
    }
  }, [customerEmail, loadCustomerProfile]);

  // Get current cache stats
  const cacheStats = customer360Cache.getStats();

  return {
    customerProfile,
    isLoading,
    error,
    isFromCache,
    cacheStats,
    refreshProfile,
    invalidateCache
  };
}

// Hook for prefetching multiple profiles (useful for email lists)
export function useCustomer360Prefetch() {
  const prefetchProfiles = useCallback(async (emails: string[]) => {
    console.log(`🚀 Prefetching profiles for ${emails.length} emails`);
    
    await customer360Cache.prefetch(emails, async (email) => {
      try {
        return await customer360OptimizedService.getCustomerProfile(email);
      } catch (error) {
        console.error(`Failed to prefetch ${email}:`, error);
        return null;
      }
    });
  }, []);

  const getCacheStats = useCallback(() => customer360Cache.getStats(), []);
  
  const clearCache = useCallback(() => customer360Cache.clear(), []);

  return {
    prefetchProfiles,
    getCacheStats,
    clearCache
  };
} 