'use client';

import { Suspense } from 'react';
import { CirculationWizard } from '@/components/circulation/CirculationWizard';
import { Skeleton } from '@/components/ui/skeleton';

export default function CirculationPage() {
  return (
    <div className="w-full space-y-6">

      <Suspense fallback={<CirculationPageSkeleton />}>
        <CirculationWizard />
      </Suspense>
    </div>
  );
}

function CirculationPageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
        <Skeleton className="h-10 w-48 rounded-lg ml-auto" />
      </div>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 h-64 bg-card/40 border border-border/60 rounded-xl" />
        <div className="lg:col-span-9 h-[500px] bg-card/40 border border-border/60 rounded-xl" />
      </div>
    </div>
  );
}
