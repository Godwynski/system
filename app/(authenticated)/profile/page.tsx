import { getMe, getPreferences } from "@/lib/auth-helpers";
import { ProfileSection } from "@/components/settings/sections/ProfileSection";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// getMe() is cache()-memoized — reuses auth already fetched by the layout
function buildProfilePromise() {
  return getMe().then(async (me) => {
    if (!me) redirect("/");
    const { user, profile } = me;
    return { user, profile };
  });
}

async function ProfileContent() {
  const [{ profile }, preferences] = await Promise.all([
    buildProfilePromise(),
    getPreferences()
  ]);

  return (
    <ProfileSection
      role={profile?.role || "student"}
      preferences={preferences}
      initialProfile={{
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        address: profile?.address || null,
        phone: profile?.phone || null,
        department: profile?.department || null,
        status: profile?.status || "PENDING",
        student_id: profile?.student_id || null,
        email: profile?.email || null,
      }}
    />
  );
}

import { Skeleton } from "@/components/ui/skeleton";

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-44 rounded-md" />
          <div className="w-full pt-4 border-t border-border/40 space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
        <div className="md:col-span-8 rounded-xl border border-border/60 bg-card/40 p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="space-y-6 w-full">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
