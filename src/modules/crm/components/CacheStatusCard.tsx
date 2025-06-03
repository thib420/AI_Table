"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Clock,
  Zap
} from 'lucide-react';
import { useCustomer360Prefetch } from '../hooks/useCustomer360Cache';
import { customer360Cache } from '../services/Customer360CacheService';

interface CacheStatusCardProps {
  className?: string;
}

export function CacheStatusCard({ className }: CacheStatusCardProps) {
  const { getCacheStats, clearCache } = useCustomer360Prefetch();
  const [stats, setStats] = React.useState(getCacheStats());

  // Update stats periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [getCacheStats]);

  const handleClearCache = () => {
    clearCache();
    setStats(getCacheStats());
  };

  const hitRate = stats.hitRate || 0;
  const cacheEfficiency = hitRate > 80 ? 'excellent' : hitRate > 60 ? 'good' : hitRate > 40 ? 'fair' : 'poor';
  
  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return <Zap className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'fair': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <RefreshCw className="h-4 w-4 text-red-600" />;
      default: return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Customer Cache Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hit Rate</span>
              <div className="flex items-center space-x-1">
                {getEfficiencyIcon(cacheEfficiency)}
                <span className={`text-sm font-medium ${getEfficiencyColor(cacheEfficiency)}`}>
                  {hitRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={hitRate} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cached Profiles</span>
              <span className="text-sm font-medium">{stats.cacheSize}</span>
            </div>
            <Progress value={(stats.cacheSize / 50) * 100} className="h-2" />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.hits}</div>
            <div className="text-xs text-muted-foreground">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.misses}</div>
            <div className="text-xs text-muted-foreground">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.totalRequests}</div>
            <div className="text-xs text-muted-foreground">Total Requests</div>
          </div>
        </div>

        {/* Efficiency Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Efficiency:</span>
            <Badge 
              variant={cacheEfficiency === 'excellent' || cacheEfficiency === 'good' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {cacheEfficiency}
            </Badge>
          </div>
          
          {/* Cache Management */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
              disabled={stats.cacheSize === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Performance Tips */}
        {hitRate < 60 && stats.totalRequests > 5 && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> Cache hit rate is low. Consider navigating to frequently viewed customer profiles to improve performance.
            </p>
          </div>
        )}

        {stats.cacheSize === 0 && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              ℹ️ <strong>Info:</strong> Cache is empty. Customer profiles will be cached as you view them, improving future navigation speed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 