import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabase() {
  if (!client) {
    client = createBrowserClient();
  }
  return client;
}
