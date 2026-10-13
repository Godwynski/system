import { Suspense } from "react";
import { getMe } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { UserDetailClient } from "./UserDetailClient";
import { mapProfileToUser } from "@/lib/utils/mappers";

// getMe() is cache()-memoized — reuses auth already fetched by the layout.
// The profile lookup for the *target* user is the only DB call needed.
function buildUserDetailPromise(userId: string) {
  return getMe().then(async (me) => {
    if (!me) redirect("/");
    const { supabase } = me;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, library_cards(*)")
      .eq("id", userId)
      .single();

    if (error || !data) notFound();

    return mapProfileToUser(data as Record<string, unknown>);
  });
}

import { Skeleton } from "@/components/ui/skeleton";

function UserDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
          <div className="w-full pt-4 border-t border-border/60 space-y-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-8 rounded-xl border border-border/60 bg-card/40 p-6 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<UserDetailSkeleton />}>
        <UserDetailLoader params={props.params} />
      </Suspense>
    </div>
  );
}

async function UserDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await buildUserDetailPromise(id);
  const me = await getMe();
  return <UserDetailClient initialUser={user} currentRole={me?.role ?? 'student'} />;
}
