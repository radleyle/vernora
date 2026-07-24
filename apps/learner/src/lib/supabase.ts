import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// EXPO_PUBLIC_* variables are inlined into the client bundle at build time.
// The publishable (anon) key is safe to ship in a browser: on its own it
// grants nothing — real authorization happens when our backend validates
// the JWT that Supabase issues after sign-in.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

/**
 * Created lazily so that missing auth configuration only breaks auth
 * features, never the whole app — the public course catalog must render
 * regardless (same principle as spec §23.2: core features must not depend
 * on optional integrations).
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Auth is not configured: set EXPO_PUBLIC_SUPABASE_URL and " +
        "EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/learner/.env " +
        "(see .env.example), then restart the dev server.",
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
