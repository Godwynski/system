import { Suspense } from "react";
import { getMe } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { AttendanceClient } from "./AttendanceClient";
import { getAttendanceHistory } from "@/lib/actions/attendance";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Attendance Logs",
  description: "View and manage library attendance sessions.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const me = await getMe();
  if (!me) redirect("/");

  // Resolve searchParams since they are dynamic in Next.js 15
  const resolvedParams = await searchParams;
  const viewParam = typeof resolvedParams.view === 'string' ? resolvedParams.view : '';

  const hasAttendancePerm = me.hasPermission('manage_attendance') && !me.isDeactivatedSA;
  const isStaff = me.role === 'super_admin' || me.role === 'librarian';
  const showSystemLogs = hasAttendancePerm && (viewParam === 'logs' || isStaff);

  const systemTodayPromise = showSystemLogs ? getAttendanceHistory(undefined) : undefined;
  const personalHistoryPromise = getAttendanceHistory(me.user.id);

  return (
    <Suspense fallback={<AttendanceSkeleton />}>
      <AttendanceClient 
        systemTodayPromise={systemTodayPromise}
        personalHistoryPromise={personalHistoryPromise}
        isStaff={showSystemLogs}
        userId={me.user.id}
      />
    </Suspense>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden shadow-xs">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
