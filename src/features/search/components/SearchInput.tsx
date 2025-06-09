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
        <div className="relative border border-border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
          <Textarea
            placeholder="Search for professional profiles... (e.g., 'Software engineers in San Francisco')"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none border-0 bg-transparent px-4 py-4 pr-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[52px] max-h-32"
            rows={1}
            disabled={isLoading}
          />
          
          {/* Send Button */}
          <Button 
            onClick={() => query.trim() && !isLoading && onSearch(query)}
            disabled={!query.trim() || isLoading}
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Helper Text */}
        {!query && !isLoading && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Try: "Marketing directors at tech companies" or "Product managers in Paris"
          </p>
        )}
      </div>
    </div>
  );
} 