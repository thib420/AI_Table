import { createBrowserClient } from '@supabase/ssr';
// No longer importing createServerClient or CookieOptions here as server client will be created directly in route handlers
// No longer importing `cookies` or its type from `next/headers` here

// createSupabaseBrowserClient has been removed as Vercel is handling auth.
// If you use Supabase for other features, you'll need a way to initialize the client for those.

// createSupabaseServerClient has been removed from this file.
// It should be created directly in Server Components or Route Handlers
// using createServerClient from '@supabase/ssr' and cookies from 'next/headers'. 