import { createBrowserClient } from "@supabase/ssr";
import { wrapWithClientOfflineProxy } from "@/lib/database/supabase-client-proxy";
import { offlineFriendlyFetch } from "@/lib/database/offline-fetch";

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        fetch: offlineFriendlyFetch,
      },
    }
  );
  return wrapWithClientOfflineProxy(client);
}
