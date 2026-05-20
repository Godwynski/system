import { createClient } from "@supabase/supabase-js";
import { wrapWithOfflineProxy } from "@/lib/database/supabase-proxy";
import { offlineFriendlyFetch } from "@/lib/database/offline-fetch";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: offlineFriendlyFetch,
    },
  });

  return wrapWithOfflineProxy(client);
}
