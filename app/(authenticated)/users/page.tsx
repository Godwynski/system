import { Suspense, use } from "react";
import { getMe } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UsersContent } from "./UsersContent";
import { getUsers } from "@/lib/actions/users";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 12;

// getMe() is cache()-memoized — reuses the auth result from the layout,
// zero extra network round-trip. The .then() chain is non-blocking.
function buildUsersPromise() {
  return getMe().then(async (me) => {
    if (!me) redirect("/");
    const { role } = me;

    if (role !== "super_admin" && role !== "librarian") {
      redirect("/dashboard");
    }

    const { users, total } = await getUsers({ tab: "all", page: 1, pageSize: PAGE_SIZE });

    return {
      users,
      count: total,
      currentRole: role,
    };
  });
}

// Synchronous page shell — responds immediately.
// Promise fires in the background; UsersContent uses use() to consume it.
export default function UsersPage() {
  const usersPromise = buildUsersPromise();

  return (
    <div className="space-y-6">
      <Suspense fallback={<UsersSkeleton />}>
        <UserPageWrapper usersPromise={usersPromise} />
      </Suspense>
    </div>
  );
}

function UserPageWrapper({ usersPromise }: { usersPromise: ReturnType<typeof buildUsersPromise> }) {
  const { currentRole } = use(usersPromise);
  
  return <UsersContent usersPromise={usersPromise} currentRole={currentRole as "super_admin" | "librarian" | "student_assistant" | "student"} />;
}

function UsersSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-3 p-2 rounded-xl border border-border/60 bg-card/40">
        <Skeleton className="h-10 w-full sm:max-w-md rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
