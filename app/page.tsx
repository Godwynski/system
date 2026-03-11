import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth-helpers";

async function HeroSection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? await getUserRole() : null;
  return <Hero user={user} role={role} />;
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Navigation Bar */}
        <nav className="w-full flex justify-center border-b border-white/10 h-16 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5">
            <div className="flex gap-3 items-center font-bold text-lg tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
              <Link href={"/"} className="hover:text-indigo-400 transition-colors">Lumina LMS</Link>
            </div>
            
            <div className="flex items-center gap-4">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense fallback={<div className="h-9 w-24 bg-zinc-800 rounded-md animate-pulse" />}>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col gap-12 max-w-5xl p-5 mt-16 w-full">
          <Suspense fallback={<Hero user={null} role={null} />}>
            <HeroSection />
          </Suspense>
          
          <main className="flex-1 flex flex-col gap-8 px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <h3 className="font-semibold text-lg text-white">Smart Catalog</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Instantly search through thousands of resources with AI-powered tagging and categorization.</p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="font-semibold text-lg text-white">Role-Based Access</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Secure workflows tailored specifically for Students, Staff, Librarians, and System Administrators.</p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                </div>
                <h3 className="font-semibold text-lg text-white">Automated Fines</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Keep track of borrowing histories, due dates, and automated fine calculations effortlessly.</p>
              </div>

            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t border-white/10 mx-auto text-center text-sm gap-8 py-12 mt-12 bg-black/20 text-zinc-500">
          <p>
            Developed with <span className="text-indigo-400">Next.js</span> and <span className="text-emerald-400">Supabase</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
