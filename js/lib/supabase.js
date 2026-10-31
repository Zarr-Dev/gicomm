// Pinned Supabase JS client for Gicomm's existing no-build ES-module frontend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../../config/supabase.js";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
  throw new Error("Gicomm Supabase configuration is missing or invalid.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
