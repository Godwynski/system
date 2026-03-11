import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-50 flex flex-col md:flex-row">
      {/* Left: Branding panel */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-10 overflow-hidden bg-black/40">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <span className="font-bold text-base tracking-tight">Lumina LMS</span>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="text-4xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">
            Join the<br />community.
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Create your account and get access to a world of library resources, borrowing history, and digital materials.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            {[
              { label: "Students", desc: "Browse, borrow, and track resources" },
              { label: "Staff & Librarians", desc: "Manage collections and users" },
              { label: "Administrators", desc: "Full system oversight and reports" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">{f.label}</span> — {f.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          © 2026 Lumina LMS. All rights reserved.
        </p>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-transparent pointer-events-none" />

        {/* Mobile logo */}
        <div className="md:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
            <span className="font-bold text-base tracking-tight">Lumina LMS</span>
          </Link>
        </div>

        <div className="w-full max-w-sm relative z-10">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
