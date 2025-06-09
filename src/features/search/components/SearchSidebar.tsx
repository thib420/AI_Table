"use client";

import React from 'react';
import { Menu, Bookmark, History, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchSidebarProps } from '@/types/search';

export function SearchSidebar({
  sidebarOpen,
  setSidebarOpen,
  savedSearches,
  recentSearches,
  isLoadingDelete,
  onSavedSearchClick,
  onRecentSearchClick,
  onDeleteSavedSearch
}: SearchSidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-40 w-80 bg-background border-r transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex-shrink-0
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">AI Table</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* New Chat Button */}
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => {
                // This could trigger a new search or clear current state
                window.location.reload();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Recent</h3>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 10).map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
                      onClick={() => {
                        onRecentSearchClick(search);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{search}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Saved</h3>
                  <Badge variant="secondary" className="text-xs">
                    {savedSearches.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="group relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
                        onClick={() => {
                          onSavedSearchClick(search);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{search.query_text}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(search.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteSavedSearch(search.id)}
                        disabled={isLoadingDelete}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {recentSearches.length === 0 && savedSearches.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">No searches yet</h3>
                  <p className="text-xs text-muted-foreground">
                    Start by searching for professional profiles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
} 