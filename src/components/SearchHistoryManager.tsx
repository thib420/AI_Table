"use client";

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExaResultItem } from '@/types/exa';
import { ColumnDef, EnrichedExaResultItem } from '@/lib/ai-column-generator';

// Types for search management
export interface SavedSearchItem {
  id: string;
  user_id: string;
  query_text: string;
  saved_at: string;
  search_results_data?: ExaResultItem[];
  enriched_results_data?: EnrichedExaResultItem[];
  column_configuration?: ColumnDef[];
  search_metadata?: {
    original_results_count: number;
    enriched_columns_count: number;
    last_enrichment_date: string;
  };
}

export interface CompleteSearchState {
  query: string;
  originalResults: ExaResultItem[];
  enrichedResults: EnrichedExaResultItem[];
  columnConfiguration: ColumnDef[];
}

export const useSearchHistory = () => {
  const { user } = useAuth();

  const fetchSavedSearches = useCallback(async (): Promise<SavedSearchItem[]> => {
    if (!user) {
      console.log("No user, returning empty array");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved searches:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in fetchSavedSearches:', err);
      return [];
    }
  }, [user]);

  const saveSearch = useCallback(async (query: string, results: ExaResultItem[]): Promise<boolean> => {
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          query_text: query,
          search_results_data: results,
          saved_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving search:', error);
        return false;
      }

      console.log('Search saved successfully');
      return true;
    } catch (err) {
      console.error('Exception in saveSearch:', err);
      return false;
    }
  }, [user]);

  const saveCompleteSearch = useCallback(async (searchState: CompleteSearchState): Promise<boolean> => {
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    try {
      const metadata = {
        original_results_count: searchState.originalResults.length,
        enriched_columns_count: searchState.columnConfiguration.filter(col => col.type === 'ai-generated').length,
        last_enrichment_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          query_text: searchState.query,
          search_results_data: searchState.originalResults,
          enriched_results_data: searchState.enrichedResults,
          column_configuration: searchState.columnConfiguration,
          search_metadata: metadata,
          saved_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving complete search:', error);
        return false;
      }

      console.log('Complete search saved successfully');
      return true;
    } catch (err) {
      console.error('Exception in saveCompleteSearch:', err);
      return false;
    }
  }, [user]);

  const deleteSavedSearch = useCallback(async (searchId: string): Promise<boolean> => {
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting search:', error);
        return false;
      }

      console.log('Search deleted successfully');
      return true;
    } catch (err) {
      console.error('Exception in deleteSavedSearch:', err);
      return false;
    }
  }, [user]);

  return {
    fetchSavedSearches,
    saveSearch,
    saveCompleteSearch,
    deleteSavedSearch
  };
}; 