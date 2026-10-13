'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-background text-xs sm:text-sm text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-muted-foreground/80">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo size={18} className="shadow-xs" />
          <span className="font-sans font-semibold text-foreground text-xs sm:text-sm">
            Lumina LMS
          </span>
          <span>·</span>
          <span>Academic Edition v2.4</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/catalog" className="hover:text-foreground transition-colors">
            Catalog
          </Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Circulation
          </Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} Lumina</span>
        </div>
      </div>
    </footer>
  );
}
