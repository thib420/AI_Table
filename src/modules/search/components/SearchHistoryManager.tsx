"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { useAuth } from '@/shared/contexts/AuthContext';
import { ExaResultItem } from '@/shared/types/exa';
import { ColumnDef, EnrichedExaResultItem } from '../services/ai-column-generator';

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
    } catch (error) {
      console.error('Error in fetchSavedSearches:', error);
      return [];
    }
  }, [user]);

  const saveSearch = useCallback(async (query: string, results: ExaResultItem[]): Promise<boolean> => {
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    try {
      const { error } = await supabase()
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
    if (!user || !searchState.query.trim()) return false;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          query_text: searchState.query,
          search_results_data: searchState.originalResults,
          enriched_results_data: searchState.enrichedResults,
          column_configuration: searchState.columnConfiguration,
          search_metadata: {
            saved_at: new Date().toISOString(),
            result_count: searchState.originalResults.length,
            column_count: searchState.columnConfiguration.length
          }
        });

      if (error) {
        console.error('Error saving search:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveCompleteSearch:', error);
      return false;
    }
  }, [user]);

  const deleteSavedSearch = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting saved search:', error);
        return false;
      }

      console.log('Search deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteSavedSearch:', error);
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