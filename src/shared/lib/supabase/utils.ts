import { createBrowserClient } from '@supabase/ssr';
import { supabase } from './client';
// No longer importing createServerClient or CookieOptions here as server client will be created directly in route handlers
// No longer importing `cookies` or its type from `next/headers` here

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// createSupabaseServerClient has been removed from this file.
// It should be created directly in Server Components or Route Handlers
// using createServerClient from '@supabase/ssr' and cookies from 'next/headers'.

/**
 * Test Supabase connection and validate database schema
 */
export async function testSupabaseConnection(): Promise<{
  isConnected: boolean;
  hasValidSchema: boolean;
  error?: string;
}> {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('saved_searches')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      return {
        isConnected: false,
        hasValidSchema: false,
        error: `Connection failed: ${connectionError.message}`
      };
    }

    // Test schema by checking if required columns exist
    const { data: schemaTest, error: schemaError } = await supabase
      .from('saved_searches')
      .select('id, user_id, query_text, saved_at, search_results_data, enriched_results_data, column_configuration, search_metadata')
      .limit(1);

    if (schemaError) {
      return {
        isConnected: true,
        hasValidSchema: false,
        error: `Schema validation failed: ${schemaError.message}`
      };
    }

    return {
      isConnected: true,
      hasValidSchema: true
    };
  } catch (error) {
    return {
      isConnected: false,
      hasValidSchema: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Initialize database schema if it doesn't exist
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // This would typically be done through Supabase migrations
    // For now, we'll just test if the table exists
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.isConnected) {
      return {
        success: false,
        error: 'Cannot connect to Supabase. Please check your configuration.'
      };
    }

    if (!connectionTest.hasValidSchema) {
      return {
        success: false,
        error: 'Database schema is invalid. Please run the SQL setup from the README.'
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 