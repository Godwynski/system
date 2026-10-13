import { Suspense } from "react";
import { getMe } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { NewUserClient } from "./NewUserClient";
import { Skeleton } from "@/components/ui/skeleton";

function NewUserSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// getMe() is cache()-memoized — reuses auth already fetched by the layout.
// NewUserClient is a pure client form with no server data deps beyond auth.
async function NewUserContent() {
  const me = await getMe();
  if (!me) redirect("/");

  return <NewUserClient currentRole={me.role} />;
}

export default function NewUserPage() {
  return (
    <div className="w-full space-y-6">
      <Suspense fallback={<NewUserSkeleton />}>
        <NewUserContent />
      </Suspense>
    </div>
  );
}
