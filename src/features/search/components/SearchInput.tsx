"use client";

import React from 'react';
import { Menu, Send, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SearchInputProps } from '@/types/search';

export function SearchInput({
  query,
  isLoading,
  sidebarOpen,
  setSidebarOpen,
  onQueryChange,
  onSearch
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isLoading) {
        onSearch(query);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Menu Button */}
      <div className="flex lg:hidden mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Input Container */}
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-end gap-x-2 border border-border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow p-2">
          <Textarea
            placeholder="Search for professional profiles... (e.g., 'Software engineers in San Francisco')"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/80 py-2 px-2"
            rows={2}
            disabled={isLoading}
          />
          
          {/* Send Button */}
          <Button 
            onClick={() => query.trim() && !isLoading && onSearch(query)}
            disabled={!query.trim() || isLoading}
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-100 flex-shrink-0"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 