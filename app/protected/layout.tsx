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
        <Suspense fallback={<div className="h-9 w-24 bg-zinc-100 rounded-md animate-pulse" />}>
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col md:flex-row selection:bg-indigo-500/30">
      <Suspense fallback={<div className="w-full md:w-64 lg:w-72 bg-white border-b md:border-b-0 md:border-r border-zinc-200 h-16 md:h-screen sticky top-0 md:fixed z-50 shadow-sm" />}>
        <NavWithRole />
      </Suspense>
      <main className="flex-1 w-full flex flex-col items-center md:pl-64 lg:pl-72 transition-all duration-300">
        <div className="w-full max-w-6xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
