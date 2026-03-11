import type { User } from '@supabase/supabase-js';

export function Hero({ user, role }: { user: User | null; role: string | null }) {
  return (
    <div className="flex flex-col gap-8 items-center justify-center p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-4 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
        <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400 tracking-tight">
          Lumina
        </span>
      </div>

      <div className="text-center z-10 flex flex-col gap-4">
        {user ? (
          <>
            <h1 className="text-2xl lg:text-3xl font-bold !leading-tight mx-auto max-w-2xl">
              Welcome back, <span className="text-indigo-400">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              You are currently logged in with the <span className="text-emerald-400 font-semibold uppercase tracking-widest">{role}</span> role.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl lg:text-3xl font-bold !leading-tight mx-auto max-w-2xl">
              Next-Generation <span className="text-indigo-400">Library Management</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              A premium, dark-mode focused library system. Seamlessly connecting Admins, Librarians, Staff, and Students in one unified platform.
            </p>
          </>
        )}
      </div>

      <div className="w-full max-w-md p-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-4 z-10" />
    </div>
  );
}
