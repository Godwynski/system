import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import { wrapWithOfflineProxy } from "@/lib/database/supabase-proxy";
import { offlineFriendlyFetch } from "@/lib/database/offline-fetch";

export const createClient = cache(async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
          }
        },
      },
      global: {
        fetch: offlineFriendlyFetch,
      },
    },
  );

  return wrapWithOfflineProxy(client);
});

export const createSafeClient = () => {
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
        },
      },
      global: {
        fetch: offlineFriendlyFetch,
      },
    }
  );

  return wrapWithOfflineProxy(client);
};
