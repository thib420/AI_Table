"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { testSupabaseConnection } from '@/lib/supabase/utils';
import { ExaResultItem } from '@/types/exa';
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
  const dummyUserId = '00000000-0000-0000-0000-000000000000'; // Placeholder for anonymous user

  // Test Supabase connection on first use
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const result = await testSupabaseConnection();
      if (!result.isConnected) {
        console.error('Supabase connection failed:', result.error);
        return false;
      }
      if (!result.hasValidSchema) {
        console.error('Supabase schema validation failed:', result.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error testing Supabase connection:', error);
      return false;
    }
  }, []);

  const fetchSavedSearches = useCallback(async (): Promise<SavedSearchItem[]> => {
    if (!dummyUserId) {
      return [];
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('Supabase connection failed, returning empty results');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', dummyUserId)
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
  }, [testConnection]);

  const saveSearch = useCallback(async (query: string, results: ExaResultItem[]): Promise<boolean> => {
    if (!dummyUserId) {
      console.error("No user logged in");
      return false;
    }

    if (!query.trim()) {
      console.error("Query is empty");
      return false;
    }

    if (!results || results.length === 0) {
      console.error("No results to save");
      return false;
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Cannot save search: Supabase connection failed');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: dummyUserId,
          query_text: query.trim(),
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
  }, [testConnection]);

  const saveCompleteSearch = useCallback(async (searchState: CompleteSearchState): Promise<boolean> => {
    if (!dummyUserId || !searchState.query.trim()) {
      console.error("Invalid user or query for saving complete search");
      return false;
    }

    if (!searchState.originalResults || searchState.originalResults.length === 0) {
      console.error("No original results to save");
      return false;
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Cannot save complete search: Supabase connection failed');
      return false;
    }

    try {
      const searchData = {
        user_id: dummyUserId,
        query_text: searchState.query.trim(),
        search_results_data: searchState.originalResults,
        enriched_results_data: searchState.enrichedResults || [],
        column_configuration: searchState.columnConfiguration || [],
        search_metadata: {
          saved_at: new Date().toISOString(),
          result_count: searchState.originalResults.length,
          column_count: searchState.columnConfiguration?.length || 0,
          enriched_columns_count: searchState.columnConfiguration?.filter(col => col.type === 'ai-generated').length || 0,
          last_enrichment_date: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('saved_searches')
        .insert(searchData);

      if (error) {
        console.error('Error saving complete search:', error);
        return false;
      }

      console.log('Complete search saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveCompleteSearch:', error);
      return false;
    }
  }, [testConnection]);

  const deleteSavedSearch = useCallback(async (id: string): Promise<boolean> => {
    if (!dummyUserId) {
      console.error("No user logged in for delete operation");
      return false;
    }

    if (!id) {
      console.error("No search ID provided for deletion");
      return false;
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Cannot delete search: Supabase connection failed');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', dummyUserId);

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
  }, [testConnection]);

  return {
    fetchSavedSearches,
    saveSearch,
    saveCompleteSearch,
    deleteSavedSearch,
    testConnection
  };
}; 