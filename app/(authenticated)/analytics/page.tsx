import { Suspense } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { getMe } from "@/lib/auth-helpers";
import { AnalyticsClient } from "./AnalyticsClient";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";

export const metadata = {
  title: "Analytics | Lumina LMS",
};

export default async function AnalyticsPage() {
  const me = await getMe();
  if (!me) return null;
  
  const { role } = me;

  if (role !== 'super_admin' && role !== 'librarian') {
    return <div className="p-8 text-center text-muted-foreground">Unauthorized access</div>;
  }

  const statsPromise = getDashboardStats({ role });
  
  return (
    <div className="flex flex-col gap-6 w-full">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsClient 
          statsPromise={statsPromise}
          role={role}
        />
      </Suspense>
    </div>
  );
}
