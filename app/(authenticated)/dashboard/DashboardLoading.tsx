import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-14 overflow-x-hidden relative text-left animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* Action Center Skeleton */}
      <div className="border border-border/60 bg-card/40 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* KPI Ledger Strip Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Holdings & Governance Ledger Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-border/60 bg-card/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-6 w-14 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-6 w-14 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded pt-2" />
          </div>
        ))}
      </div>

      {/* System Shortcuts Grid Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/60 bg-card/40 flex items-center gap-3.5 shadow-xs">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Cataloged Books Shelf Skeleton */}
      <div className="border border-border/60 bg-card/40 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-2.5">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
