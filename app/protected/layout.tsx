import { ProtectedNav } from "@/components/protected-nav";
import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";
import { getUserRole } from "@/lib/auth-helpers";

type Role = "super_admin" | "librarian" | "student" | null;

async function NavWithRole() {
  const role = (await getUserRole()) as Role;
  return (
    <ProtectedNav
      role={role}
      authNode={
        <Suspense fallback={<div className="h-9 w-24 bg-zinc-800 rounded-md animate-pulse" />}>
          <AuthButton />
        </Suspense>
      }
    />
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-indigo-500/30">
      <Suspense fallback={<div className="h-16 bg-zinc-950 border-b border-white/10 sticky top-0 z-50" />}>
        <NavWithRole />
      </Suspense>
      <main className="flex-1 w-full flex flex-col items-center">
        <div className="w-full max-w-6xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
