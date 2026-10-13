import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left w-full">
      {/* Header & Controls Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 sm:w-96 rounded-lg" />
          <Skeleton className="h-4 w-52 sm:w-80 rounded-md" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="hidden md:block h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
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
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Primary Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circulation Velocity Chart Skeleton */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between pb-3 border-b border-border/40">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-3.5 w-60 rounded" />
            </div>
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-[280px] sm:h-[340px] w-full rounded-lg" />
        </div>

        {/* Hourly Distribution Chart Skeleton */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between pb-3 border-b border-border/40">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-[280px] sm:h-[340px] w-full rounded-lg" />
        </div>
      </div>

      {/* Secondary Analytics Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Skeleton */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-5">
          <div className="space-y-2 pb-3 border-b border-border/40">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-52 rounded" />
          </div>
          <div className="space-y-4 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-12 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* High Demand Volumes Table Skeleton */}
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-60 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <div className="space-y-3 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48 sm:w-64 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
