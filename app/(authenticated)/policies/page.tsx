import { getMe } from "@/lib/auth-helpers";
import { PoliciesSection } from "@/components/settings/sections/PoliciesSection";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function PoliciesPageContent() {
  const me = await getMe();

  if (!me) {
    redirect("/");
  }

  const { supabase, profile } = me;

  // Both queries fire in parallel — authed client handles RLS for categories too
  const settingsPromise = supabase
    .from("system_settings")
    .select("*")
    .order("key")
    .then(res => res.data || []);

  const categoriesPromise = supabase
    .from("categories")
    .select("id, name, slug, description, is_active, created_at")
    .order("name")
    .then(res => res.data || []);

  return (
    <PoliciesSection 
      role={profile?.role || "student"} 
      settingsPromise={settingsPromise} 
      categoriesPromise={categoriesPromise}
    />
  );
}

import { Skeleton } from "@/components/ui/skeleton";

function PoliciesSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-72 rounded-md" />
            </div>
            <Skeleton className="h-6 w-12 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<PoliciesSkeleton />}>
        <PoliciesPageContent />
      </Suspense>
    </div>
  );
}
