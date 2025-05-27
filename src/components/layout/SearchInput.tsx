"use client";

import React from 'react';
import { Menu, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SearchInputProps } from '@/shared/types/search';

export function SearchInput({
  query,
  isLoading,
  sidebarOpen,
  setSidebarOpen,
  onQueryChange,
  onSearch
}: SearchInputProps) {
  return (
    <div className="bg-background border-t p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex space-x-3 items-start">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0 mt-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Textarea
              placeholder="Search for professional profiles... (Shift + Enter for new line)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSearch(query);
                }
              }}
              className="pr-12 py-3 text-base resize-none"
              rows={3}
              disabled={isLoading}
            />
            <Button 
              onClick={() => onSearch(query)}
              disabled={isLoading || !query.trim()}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 