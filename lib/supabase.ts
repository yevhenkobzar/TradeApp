import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's standard import.meta.env
// We use optional chaining to prevent runtime crashes if env is not fully loaded
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Create the client only if keys are present
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = !!supabase;