import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project details."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// URL of the deployed coach-chat Edge Function, e.g.
// https://<project-ref>.supabase.co/functions/v1/coach-chat
export const COACH_CHAT_URL = import.meta.env.VITE_COACH_CHAT_URL;
