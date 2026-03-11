import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth-helpers";
import { Suspense } from "react";
import Link from "next/link";
import {
  Library,
  Users,
  BookMarked,
  BarChart2,
  ShieldCheck,
  Settings,
  History,
  CreditCard,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";

type Role = "admin" | "librarian" | "staff" | "student" | null;

interface QuickCard {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  roles: Role[];
}

const QUICK_CARDS: QuickCard[] = [
  {
    href: "/protected/catalog",
    label: "Catalog & Inventory",
    description: "Manage books, categories, borrowing, and renewals.",
    icon: Library,
    color: "indigo",
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/users",
    label: "Users & Roles",
    description: "Manage admins, librarians, students, and e-library card approvals.",
    icon: Users,
    color: "violet",
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/fines",
    label: "Fines",
    description: "View, pay, and waive borrower fines.",
    icon: BookMarked,
    color: "rose",
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/reports",
    label: "Reports & Analytics",
    description: "View system-wide usage reports and analytics.",
    icon: BarChart2,
    color: "emerald",
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/history",
    label: "My History",
    description: "View your borrowing history and self-service renewals.",
    icon: History,
    color: "sky",
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/my-card",
    label: "E-Library Card",
    description: "View and manage your digital library card.",
    icon: CreditCard,
    color: "amber",
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/resources",
    label: "Digital Resources",
    description: "Access e-books, journals, and digital materials.",
    icon: BookOpen,
    color: "teal",
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/settings",
    label: "Settings",
    description: "Configure system-wide settings and preferences.",
    icon: Settings,
    color: "zinc",
    roles: ["admin"],
  },
  {
    href: "/protected/audit",
    label: "Audit Logs",
    description: "Review system activity and audit trails.",
    icon: ShieldCheck,
    color: "orange",
    roles: ["admin"],
  },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:     { label: "Admin",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  librarian: { label: "Librarian", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  staff:     { label: "Staff",     color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  student:   { label: "Student",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

const COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
  rose:   "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
  emerald:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  sky:    "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20",
  amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
  teal:   "bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20",
  zinc:   "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
};

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (await getUserRole()) as Role;

  const roleInfo = role ? ROLE_LABELS[role] : null;
  const visibleCards = QUICK_CARDS.filter(
    (card) => !role || card.roles.includes(role)
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <LayoutDashboard size={22} className="text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          {roleInfo && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          )}
        </div>
        <p className="text-zinc-400 text-sm">
          Welcome back{user?.email ? `, ${user.email}` : ""}. Here&apos;s what you have access to.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          const colorClass = COLOR_MAP[card.color] ?? COLOR_MAP["zinc"];
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
            >
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-colors ${colorClass}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {card.label}
                </span>
                <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton shown while DashboardContent loads
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-72 bg-zinc-800/60 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.02] h-32" />
        ))}
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
