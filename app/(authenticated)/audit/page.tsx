import { Suspense } from "react";
import { getUserRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { AuditLogClient } from "@/components/admin/AuditLogClient";

export const metadata = {
  title: "Audit Logs | Lumina LMS",
};

// Synchronous page shell — responds immediately.
export default function AuditPage() {
  return (
    <div className="space-y-6 w-full">
      <Suspense fallback={<AuditSkeleton />}>
        <AuditAuthGate />
      </Suspense>
    </div>
  );
}

// Only awaits getUserRole() — a cache()-memoized call that reuses the
// auth already fetched by the layout. No extra round-trip.
async function AuditAuthGate() {
  const role = await getUserRole();

  if (role !== "super_admin") {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <div className="w-full">
      <AuditLogClient />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

function AuditSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between gap-3 p-2 rounded-xl border border-border/60 bg-card/40">
        <Skeleton className="h-10 w-full sm:max-w-md rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
