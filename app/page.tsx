import { Logo } from "@/components/layout/Logo";
import { AuthButton } from "@/components/auth/AuthButton";
import { Hero } from "@/components/hero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { getMe } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Lumina LMS | Academic Library Platform",
  description: "Minimalist institutional library management platform with optical barcode circulation, autonomous ISBN cataloging, and automated penalty governance.",
};

async function HeroSection() {
  const me = await getMe();
  return <Hero user={me?.user ?? null} role={me?.role ?? null} />;
}

async function AuthRedirect() {
  const me = await getMe();

  if (me?.user) {
    return redirect("/dashboard");
  }
  return null;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-foreground selection:text-background flex flex-col justify-between">
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>

      {/* Header with Fluid Responsive Scaling */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex h-16 sm:h-18 w-full max-w-6xl mx-auto items-center justify-between px-4 sm:px-6 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <Logo size={20} className="shadow-xs transition-opacity group-hover:opacity-80" />
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              Lumina LMS
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-mono text-muted-foreground">
            <span className="hidden sm:inline">Academic Edition</span>
            {hasEnvVars && (
              <Suspense fallback={<Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Functional Console with Fluid Boundaries */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Suspense fallback={
          <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-6 px-6">
            <Skeleton className="h-12 w-64 sm:w-96 rounded-xl opacity-20" />
            <Skeleton className="h-5 w-72 sm:w-[480px] rounded-lg opacity-10" />
            <Skeleton className="h-14 w-full max-w-md rounded-xl opacity-15" />
          </div>
        }>
          <HeroSection />
        </Suspense>
      </div>

      {/* Minimal Responsive Footer */}
      <LandingFooter />
    </main>
  );
}
