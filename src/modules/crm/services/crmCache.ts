import { Contact, Deal, Company } from '../types';

interface CRMCache {
  contacts: Contact[];
  deals: Deal[];
  companies: Company[];
  lastFetch: number;
  isInitialized: boolean;
}

// Global in-memory cache that persists across component unmounts
let globalCache: CRMCache = {
  contacts: [],
  deals: [],
  companies: [],
  lastFetch: 0,
  isInitialized: false
};

// Cache TTL: 10 minutes (CRM data changes less frequently than emails)
const CACHE_TTL = 10 * 60 * 1000;

export const crmCache = {
  // Get cached data if still valid
  get(): CRMCache | null {
    const now = Date.now();
    if (globalCache.isInitialized && (now - globalCache.lastFetch) < CACHE_TTL) {
      console.log('📦 Using CRM in-memory cache (age:', Math.round((now - globalCache.lastFetch) / 1000), 'seconds)');
      return globalCache;
    }
    return null;
  },

  // Update cache with contacts only
  setContacts(contacts: Contact[]) {
    globalCache.contacts = contacts;
    globalCache.lastFetch = Date.now();
    globalCache.isInitialized = true;
    console.log('💾 Updated CRM cache with', contacts.length, 'contacts');
  },

  // Update cache with deals only
  setDeals(deals: Deal[]) {
    globalCache.deals = deals;
    globalCache.lastFetch = Date.now();
    globalCache.isInitialized = true;
    console.log('💾 Updated CRM cache with', deals.length, 'deals');
  },

  // Update cache with companies only
  setCompanies(companies: Company[]) {
    globalCache.companies = companies;
    globalCache.lastFetch = Date.now();
    globalCache.isInitialized = true;
    console.log('💾 Updated CRM cache with', companies.length, 'companies');
  },

  // Update entire cache
  setAll(contacts: Contact[], deals: Deal[], companies: Company[]) {
    globalCache = {
      contacts,
      deals,
      companies,
      lastFetch: Date.now(),
      isInitialized: true
    };
    console.log('💾 Updated full CRM cache with', contacts.length, 'contacts,', deals.length, 'deals,', companies.length, 'companies');
  },

  // Get contacts only
  getContacts(): Contact[] | null {
    const cached = this.get();
    return cached ? cached.contacts : null;
  },

  // Get deals only
  getDeals(): Deal[] | null {
    const cached = this.get();
    return cached ? cached.deals : null;
  },

  // Get companies only
  getCompanies(): Company[] | null {
    const cached = this.get();
    return cached ? cached.companies : null;
  },

  // Clear cache
  clear() {
    globalCache = {
      contacts: [],
      deals: [],
      companies: [],
      lastFetch: 0,
      isInitialized: false
    };
    console.log('🗑️ Cleared CRM in-memory cache');
  },

  // Check if cache is valid
  isValid(): boolean {
    const now = Date.now();
    return globalCache.isInitialized && (now - globalCache.lastFetch) < CACHE_TTL;
  }
}; 