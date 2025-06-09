import React from 'react';

interface LoadingProgressProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  submessage?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  showPercentage?: boolean;
}

export function LoadingProgress({ 
  isLoading, 
  progress = 0, 
  message = 'Loading...', 
  submessage,
  className = '',
  variant = 'default',
  showPercentage = true
}: LoadingProgressProps) {
  if (!isLoading) return null;

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-6 bg-background/95 backdrop-blur border rounded-lg shadow-lg ${className}`}>
        <div className="flex items-start space-x-4">
          <div className="relative w-5 h-5 mt-0.5">
            <div className="absolute inset-0 border-2 border-muted rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-sm font-medium">{message}</div>
              {submessage && (
                <div className="text-xs text-muted-foreground mt-1">{submessage}</div>
              )}
            </div>
            
            {progress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                {showPercentage && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-4 ${className}`}>
      <div className="relative w-4 h-4">
        <div className="absolute inset-0 border-2 border-muted rounded-full"></div>
        <div 
          className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"
          style={{ animationDuration: '1s' }}
        />
      </div>
      
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{message}</div>
        {submessage && (
          <div className="text-xs text-muted-foreground/70 mt-0.5">{submessage}</div>
        )}
        
        {progress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {showPercentage && (
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton loader component for instant loading states
export function SkeletonLoader({ className = '', variant = 'default' }: { className?: string, variant?: 'default' | 'list' | 'card' }) {
  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`grid gap-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-4">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
    </div>
  );
} 