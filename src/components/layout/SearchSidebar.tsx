"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Bookmark, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchSidebarProps } from '@/shared/types/search';

export function SearchSidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarExpanded,
  setSidebarExpanded,
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
        fixed inset-y-0 left-0 z-40 bg-background border-r transition-all duration-200 ease-in-out
        lg:relative lg:translate-x-0 top-0 lg:flex-shrink-0
        ${sidebarExpanded ? 'w-72' : 'w-16'}
      `}>
        <div className="flex h-full flex-col">
          {/* Toggle Button */}
          <div className={`flex ${sidebarExpanded ? 'justify-end' : 'justify-center'} p-2 border-b`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-8 w-8"
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className={`flex-1 overflow-y-auto ${sidebarExpanded ? 'p-6' : 'p-2'} space-y-4`}>
            {/* Saved Searches */}
            <div className="space-y-3">
              <div className={`flex items-center ${sidebarExpanded ? 'space-x-2' : 'justify-center'}`}>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                {sidebarExpanded && (
                  <>
                    <h3 className="text-sm font-medium">Saved Searches</h3>
                    <Badge variant="secondary" className="text-xs">
                      {savedSearches.length}
                    </Badge>
                  </>
                )}
              </div>
              <div className="space-y-1">
                {savedSearches.length === 0 ? (
                  sidebarExpanded ? (
                    <div className="text-center py-6">
                      <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No saved searches yet</p>
                      <p className="text-xs text-muted-foreground">Save your searches to access them later</p>
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <Badge variant="secondary" className="text-xs px-1 py-0.5">
                        0
                      </Badge>
                    </div>
                  )
                ) : (
                  savedSearches.map((search) => (
                    <div key={search.id} className="group relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full ${sidebarExpanded ? 'justify-start text-left h-auto p-3' : 'justify-center h-10 p-0'} hover:bg-muted/50`}
                        onClick={() => {
                          onSavedSearchClick(search);
                          setSidebarOpen(false);
                        }}
                        title={!sidebarExpanded ? search.query_text : undefined}
                      >
                        {sidebarExpanded ? (
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{search.query_text}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(search.saved_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {sidebarExpanded && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteSavedSearch(search.id)}
                          disabled={isLoadingDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {sidebarExpanded && <Separator />}

            {/* Recent Searches */}
            <div className="space-y-3">
              <div className={`flex items-center ${sidebarExpanded ? 'space-x-2' : 'justify-center'}`}>
                <History className="h-4 w-4 text-muted-foreground" />
                {sidebarExpanded && (
                  <>
                    <h3 className="text-sm font-medium">Recent Searches</h3>
                    <Badge variant="secondary" className="text-xs">
                      {recentSearches.length}
                    </Badge>
                  </>
                )}
              </div>
              <div className="space-y-1">
                {recentSearches.length === 0 ? (
                  sidebarExpanded ? (
                    <div className="text-center py-6">
                      <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No recent searches</p>
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <Badge variant="secondary" className="text-xs px-1 py-0.5">
                        0
                      </Badge>
                    </div>
                  )
                ) : (
                  recentSearches.slice(0, sidebarExpanded ? 8 : 4).map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className={`w-full ${sidebarExpanded ? 'justify-start text-left h-auto p-3' : 'justify-center h-10 p-0'} hover:bg-muted/50`}
                      onClick={() => {
                        onRecentSearchClick(search);
                        setSidebarOpen(false);
                      }}
                      title={!sidebarExpanded ? search : undefined}
                    >
                      {sidebarExpanded ? (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{search}</p>
                        </div>
                      ) : (
                        <History className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
} 