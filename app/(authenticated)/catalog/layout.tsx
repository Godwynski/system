import { getMe } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function CatalogGuard({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect('/');
  
  const { role } = me;

  if (['super_admin', 'librarian'].includes(role)) {
    redirect('/inventory');
  }

  // If student or student_assistant, maybe they should go to student-catalog
  redirect('/student-catalog');

  return <>{children}</>;
}

import { Skeleton } from '@/components/ui/skeleton';

function CatalogLayoutSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/40">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<CatalogLayoutSkeleton />}>
      <CatalogGuard>
        {children}
      </CatalogGuard>
    </Suspense>
  );
}
