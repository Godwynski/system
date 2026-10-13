import { getMe } from "@/lib/auth-helpers";
import { SecuritySection } from "@/components/settings/sections/SecuritySection";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// getMe() is cache()-memoized — reuses auth already fetched by the layout
async function SecurityPageContent() {
  const me = await getMe();
  if (!me) redirect("/");

  return <SecuritySection role={me.profile?.role || "student"} />;
}

import { Skeleton } from "@/components/ui/skeleton";

function SecuritySkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="space-y-6 w-full">
      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityPageContent />
      </Suspense>
    </div>
  );
}
