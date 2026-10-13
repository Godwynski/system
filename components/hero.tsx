'use client';

import type { User } from '@supabase/supabase-js';
import { m } from "framer-motion";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Loader2, 
  ScanLine, 
  BookMarked, 
  ShieldCheck 
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MicrosoftIcon } from '@/components/ui/microsoft-icon';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Hero({ user, role }: { user: User | null; role: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const router = useRouter();

  const handleMicrosoftLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email profile",
          redirectTo: `${window.location.origin}/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      console.error(error);
      toast.error('Microsoft sign-in failed');
      setIsLoading(false);
    }
  };

  const signInWithCredentials = async (email: string) => {
    const supabase = createClient();
    setIsLoading(true);
    setLoadingEmail(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "Password123!",
      });
      if (error) throw error;
      toast.success('Signed in successfully');
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      toast.error(`Login failed: ${errorMessage}`);
      setIsLoading(false);
      setLoadingEmail(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <m.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-5xl mx-auto text-center py-10 sm:py-16 md:py-24 px-4 sm:px-6"
    >
      {/* Title & Purpose with Fluid Responsive Typography */}
      <m.div variants={itemVariants} className="space-y-4 sm:space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
          {user ? (
            <>
              Welcome back,
              <span className="text-muted-foreground block font-normal text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}.
              </span>
            </>
          ) : (
            <>
              Lumina Library Platform
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
          {user ? (
            `Signed in with the ${role || 'authenticated'} profile. Your circulation queues, policy tools, and inventory dashboard are ready.`
          ) : (
            'Unified circulation, autonomous cataloging, and automated policy governance for institutional libraries.'
          )}
        </p>
      </m.div>

      {/* Responsive Authentication Console */}
      <m.div variants={itemVariants} className="mt-8 sm:mt-12 w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto space-y-5">
        {user ? (
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2">
            <Button 
              asChild 
              size="lg" 
              className="rounded-xl font-semibold px-6 sm:px-8 h-12 sm:h-13 text-sm sm:text-base bg-foreground text-background hover:bg-foreground/90 transition-all w-full sm:w-auto shadow-sm"
            >
              <Link href="/dashboard">
                Open Circulation Desk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="rounded-xl font-semibold px-6 sm:px-8 h-12 sm:h-13 text-sm sm:text-base border-border/80 w-full sm:w-auto hover:bg-muted/50 transition-all"
            >
              <Link href="/catalog">
                Search Catalog
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 sm:h-14 w-full rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-3 border-border/80 bg-card text-foreground hover:bg-muted/50 transition-all shadow-xs"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              {isLoading && !loadingEmail ? (
                <Loader2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
              ) : (
                <MicrosoftIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
              <span>{isLoading && !loadingEmail ? "Connecting to Azure AD..." : "Sign in with Microsoft Azure AD"}</span>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background px-3 text-muted-foreground font-mono">
                  Quick Access Demo Roles
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left">
              {[
                { label: "Super Admin", email: "admin@lumina.test", role: "Full System Admin" },
                { label: "Chief Librarian", email: "librarian@lumina.test", role: "Circulation & Books" },
                { label: "Circulation Staff", email: "staff@lumina.test", role: "Checkout Desk" },
                { label: "Student Scholar", email: "student@lumina.test", role: "Patron Access" },
              ].map((roleItem) => {
                const isThisLoading = loadingEmail === roleItem.email;
                return (
                  <button
                    key={roleItem.email}
                    type="button"
                    className="h-14 sm:h-16 rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 transition-all hover:border-foreground/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 flex flex-col justify-between shadow-xs disabled:opacity-50"
                    onClick={() => signInWithCredentials(roleItem.email)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {roleItem.label}
                      </span>
                      {isThisLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </div>
                    <span className="font-mono text-2xs sm:text-xs text-muted-foreground truncate">
                      {roleItem.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </m.div>

      {/* Real Specifications with Responsive Scaling */}
      <m.div variants={itemVariants} className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
            <ScanLine className="h-4 w-4 sm:h-5 sm:w-5 text-foreground shrink-0" />
            <span>Optical Circulation</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Barcode and QR code reader integration for instant check-in, checkout, and role-based borrowing limit validation.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
            <BookMarked className="h-4 w-4 sm:h-5 sm:w-5 text-foreground shrink-0" />
            <span>Autonomous Cataloging</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Automated metadata discovery via OpenLibrary and Google Books for immediate Dewey Decimal and shelf placement.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-foreground shrink-0" />
            <span>Audit & Governance</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Append-only change logging for all circulation overrides, automated penalty rules, and Microsoft Azure AD identity.
          </p>
        </div>
      </m.div>
    </m.div>
  );
}
