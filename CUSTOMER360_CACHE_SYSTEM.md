# Customer360 Cache System

## Overview

The Customer360 caching system has been implemented to provide fluid navigation between customer profiles by caching customer data locally. This dramatically improves performance and user experience when navigating between different customer views.

## Key Features

### 🚀 Performance Benefits
- **Instant Loading**: Cached profiles load instantaneously
- **Background Refresh**: Old cache entries are refreshed in the background
- **Smart Prefetching**: Email list automatically prefetches customer profiles
- **Fallback Support**: Expired cache used as fallback during network errors

### 🧠 Intelligent Caching
- **LRU Eviction**: Automatically removes least recently used entries when cache is full
- **Time-based Expiry**: Cache entries expire after 5 minutes to ensure data freshness
- **Background Updates**: Profiles older than 2 minutes get refreshed in background
- **Cache Size Management**: Limits cache to 50 profiles to prevent memory issues

### 📊 Cache Analytics
- **Real-time Statistics**: Hit rate, cache size, and efficiency metrics
- **Performance Monitoring**: Visual indicators for cache status
- **Development Insights**: Cache stats visible in development mode

## Architecture

### Core Components

1. **Customer360CacheService** (`src/modules/crm/services/Customer360CacheService.ts`)
   - Core caching logic with LRU eviction
   - Time-based expiry and background refresh
   - Statistics tracking and cache management

2. **useCustomer360Cache Hook** (`src/modules/crm/hooks/useCustomer360Cache.ts`)
   - React hook for cached customer profile loading
   - Background refresh and error handling
   - Cache status indicators

3. **Customer360View Component** (`src/modules/crm/components/Customer360View.tsx`)
   - Updated to use caching hook
   - Cache status indicators in UI
   - Refresh functionality

4. **CacheStatusCard Component** (`src/modules/crm/components/CacheStatusCard.tsx`)
   - Visual cache performance monitoring
   - Cache management controls
   - Performance tips and insights

5. **Prefetching Integration** (`src/modules/mailbox/components/MailboxPage/MailboxList.tsx`)
   - Automatic prefetching of customer profiles from email lists
   - Background loading for improved navigation

## Usage

### Basic Usage

```typescript
import { useCustomer360Cache } from '@/modules/crm/hooks/useCustomer360Cache';

function CustomerView({ email }) {
  const {
    customerProfile,
    isLoading,
    error,
    isFromCache,
    refreshProfile,
    invalidateCache
  } = useCustomer360Cache(email);

  return (
    <div>
      {isFromCache && <Badge>Cached</Badge>}
      {/* Your UI here */}
    </div>
  );
}
```

### Prefetching

```typescript
import { useCustomer360Prefetch } from '@/modules/crm/hooks/useCustomer360Cache';

function EmailList({ emails }) {
  const { prefetchProfiles } = useCustomer360Prefetch();
  
  useEffect(() => {
    const emailAddresses = emails.map(e => e.senderEmail);
    prefetchProfiles(emailAddresses);
  }, [emails]);
}
```

### Cache Management

```typescript
import { customer360Cache } from '@/modules/crm/services/Customer360CacheService';

// Get cache statistics
const stats = customer360Cache.getStats();

// Clear specific entry
customer360Cache.invalidate('user@example.com');

// Clear entire cache
customer360Cache.clear();

// Update cached profile
customer360Cache.update('user@example.com', updatedProfile);
```

## Cache Behavior

### Cache Strategy

1. **Cache First**: Always check cache before making API calls
2. **Background Refresh**: Refresh old entries without blocking UI
3. **Smart Prefetch**: Automatically cache profiles from email lists
4. **Graceful Degradation**: Use expired cache as fallback during errors

### Cache Lifecycle

1. **Miss**: Profile not in cache → Fetch from API → Cache result
2. **Hit (Fresh)**: Profile in cache and recent → Return immediately
3. **Hit (Stale)**: Profile in cache but old → Return cache + background refresh
4. **Expired**: Profile older than 5 minutes → Fetch fresh data
5. **Error**: API fails → Use expired cache as fallback

### Memory Management

- **Max Size**: 50 customer profiles
- **Eviction**: LRU (Least Recently Used)
- **Expiry**: 5 minutes for data freshness
- **Background Refresh**: 2 minutes for proactive updates

## Performance Metrics

The system tracks comprehensive performance metrics:

- **Hit Rate**: Percentage of requests served from cache
- **Cache Size**: Number of profiles currently cached
- **Total Requests**: Number of profile requests made
- **Hits/Misses**: Detailed breakdown of cache performance

### Performance Targets

- **Excellent**: >80% hit rate
- **Good**: 60-80% hit rate  
- **Fair**: 40-60% hit rate
- **Poor**: <40% hit rate

## UI Indicators

### Cache Status Badges
- **"Cached"** badge shows when data is served from cache
- **Cache stats** visible in development mode
- **Refresh button** for manual cache invalidation

### Cache Status Card
- Real-time performance metrics
- Visual progress bars for hit rate and cache utilization
- Cache management controls
- Performance tips and insights

## Implementation Benefits

### User Experience
- **Instant Navigation**: No loading delays when switching between cached profiles
- **Reduced API Calls**: Fewer requests to Microsoft Graph API
- **Offline Resilience**: Cached data available during network issues
- **Proactive Loading**: Prefetching reduces perceived load times

### Technical Benefits
- **Rate Limit Protection**: Reduces API calls to stay within limits
- **Error Resilience**: Graceful fallback to cached data
- **Memory Efficient**: LRU eviction prevents memory bloat
- **Observable Performance**: Real-time metrics for monitoring

### Development Benefits
- **Easy Integration**: Simple React hook interface
- **Flexible Configuration**: Adjustable cache size and expiry
- **Debug Friendly**: Comprehensive logging and statistics
- **Type Safe**: Full TypeScript support

## Configuration

Key configuration options in `Customer360CacheService.ts`:

```typescript
private maxCacheSize = 50; // Maximum profiles to cache
private cacheExpiryMs = 5 * 60 * 1000; // 5 minute expiry
private backgroundRefreshAge = 2 * 60 * 1000; // 2 minute background refresh
```

## Monitoring

### Development Mode
- Cache stats badge in Customer360View header
- Console logging for cache hits/misses
- Performance tips in CacheStatusCard

### Production Mode
- CacheStatusCard in CRM dashboard
- Cache statistics API
- Error tracking for cache failures

## Future Enhancements

### Potential Improvements
1. **Persistent Cache**: Local storage for cache persistence across sessions
2. **Intelligent Prefetching**: ML-based prediction of likely viewed profiles
3. **Real-time Updates**: WebSocket integration for live profile updates
4. **Distributed Cache**: Shared cache across browser tabs
5. **Cache Warming**: Pre-populate cache with frequently accessed profiles

### Advanced Features
- **Compression**: Compress cached data to reduce memory usage
- **Selective Refresh**: Update only changed fields instead of full profile
- **Priority Queuing**: Prioritize important profiles in cache
- **Analytics Integration**: Track cache performance in analytics

This caching system provides a significant performance boost to the Customer360 view while maintaining data freshness and providing excellent user experience. 