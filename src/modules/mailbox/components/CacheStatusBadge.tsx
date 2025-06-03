import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Database, 
  HardDrive, 
  Clock, 
  Trash2, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { emailCacheService } from '../services/EmailCacheService';
import { useAuth } from '@/shared/contexts/AuthContext';

interface CacheStats {
  totalEmails: number;
  totalFolders: number;
  lastSync: string | null;
  cacheSize: string;
}

interface CacheStatusBadgeProps {
  isCacheEnabled: boolean;
  onClearCache?: () => void;
  onRefreshCache?: () => void;
  isSyncing?: boolean;
}

export function CacheStatusBadge({ 
  isCacheEnabled, 
  onClearCache, 
  onRefreshCache,
  isSyncing = false
}: CacheStatusBadgeProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    if (!user || !isCacheEnabled) return;

    try {
      setIsLoading(true);
      const cacheStats = await emailCacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user, isCacheEnabled]);

  const handleClearCache = async () => {
    if (!user || !isCacheEnabled) return;

    try {
      setIsLoading(true);
      await emailCacheService.clearCache();
      setStats({
        totalEmails: 0,
        totalFolders: 0,
        lastSync: null,
        cacheSize: '0 Bytes'
      });
      onClearCache?.();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCache = () => {
    onRefreshCache?.();
    // Reload stats after a delay
    setTimeout(loadStats, 1000);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isCacheEnabled) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Database className="h-3 w-3" />
        Cache Disabled
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="default" 
          className="flex items-center gap-1 cursor-pointer hover:bg-primary/80"
        >
          {isSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          {isSyncing ? 'Syncing...' : 'Cache Active'}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Email Cache</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {stats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{stats.totalEmails}</div>
                    <div className="text-muted-foreground text-xs">Emails</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{stats.totalFolders}</div>
                    <div className="text-muted-foreground text-xs">Folders</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cache Size</span>
                  <span className="font-medium">{stats.cacheSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="font-medium">{formatLastSync(stats.lastSync)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshCache}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {!stats && !isLoading && (
            <div className="text-center text-muted-foreground text-sm">
              No cache data available
            </div>
          )}

          {isLoading && (
            <div className="text-center text-muted-foreground text-sm">
              Loading cache statistics...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 