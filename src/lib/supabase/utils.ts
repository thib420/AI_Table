import { createBrowserClient } from '@supabase/ssr';
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