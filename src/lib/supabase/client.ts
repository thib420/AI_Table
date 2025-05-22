import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpeuzrfkbtkzuabcioun.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZXV6cmZrYnRrenVhYmNpb3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDE2NjYsImV4cCI6MjA2MzQ3NzY2Nn0.Ud5oCeUjnHCBQYFV2mRh6wyu2ykDkFZ0_R_bre1CHHc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 