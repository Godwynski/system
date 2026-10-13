import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-2 flex flex-col sm:flex-row items-center gap-3">
        <Skeleton className="h-10 w-full sm:w-72 rounded-lg" />
        <div className="flex items-center gap-2 ml-auto">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Table Shell */}
      <div className="rounded-xl border border-border/60 bg-card/40 shadow-xs overflow-hidden">
        <div className="h-11 w-full bg-muted/30 border-b border-border/40 px-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
