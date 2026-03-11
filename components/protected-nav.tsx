"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  BookOpen,
  Users,
  Settings,
  LayoutDashboard,
  History,
  CreditCard,
  BarChart2,
  ShieldCheck,
  Library,
  BookMarked,
} from "lucide-react";

type Role = "admin" | "librarian" | "staff" | "student" | null;

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_LINKS: NavLink[] = [
  {
    href: "/protected",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/catalog",
    label: "Catalog & Inventory",
    icon: Library,
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/users",
    label: "Users & Roles",
    icon: Users,
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/fines",
    label: "Fines",
    icon: BookMarked,
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/reports",
    label: "Reports & Analytics",
    icon: BarChart2,
    roles: ["admin", "librarian", "staff"],
  },
  {
    href: "/protected/history",
    label: "My History",
    icon: History,
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/my-card",
    label: "E-Library Card",
    icon: CreditCard,
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/resources",
    label: "Digital Resources",
    icon: BookOpen,
    roles: ["admin", "librarian", "staff", "student"],
  },
  {
    href: "/protected/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    href: "/protected/audit",
    label: "Audit Logs",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/protected") return pathname === href;
  return pathname.startsWith(href);
}

export function ProtectedNav({
  authNode,
  role,
}: {
  authNode?: React.ReactNode;
  role?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const visibleLinks = NAV_LINKS.filter(
    (link) => !role || link.roles.includes(role as Role)
  );

  const currentLink = visibleLinks.find((link) => isActive(pathname, link.href));
  const moduleName = currentLink?.label ?? "Dashboard";

  return (
    <>
      {/* 
        =============================================================================
        MOBILE NAVIGATION (Top Bar + Drawer)
        Displays on < md screens.
        =============================================================================
      */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 bg-white border-b border-zinc-200 md:hidden shadow-sm shadow-zinc-200/50 w-full shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 focus:outline-none transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-semibold text-lg text-zinc-900 truncate">{moduleName}</span>
        </div>
        {/* We moved authNode to the drawer on mobile to save space, but keeping a placeholder or just trusting the drawer is better. */}
      </header>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <nav
            className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-zinc-200 p-4 flex flex-col shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl px-2 py-4 mb-2 border-b border-zinc-100 shrink-0">
              <BookOpen size={24} /> Lumina
            </div>
            
            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
              {visibleLinks.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <Icon size={20} />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* AuthNode at the bottom of the drawer on mobile */}
            <div className="mt-auto pt-4 border-t border-zinc-100 shrink-0">
               {authNode}
            </div>
          </nav>
        </div>
      )}

      {/* 
        =============================================================================
        DESKTOP NAVIGATION (Fixed Left Sidebar)
        Displays on >= md screens.
        =============================================================================
      */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 lg:w-72 flex-col bg-white border-r border-zinc-200 shadow-sm transition-all duration-300">
        {/* Sidebar Header (App Logo) */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 shrink-0">
          <Link href="/protected" className="flex items-center gap-3 text-indigo-600 font-bold text-xl transition-opacity hover:opacity-80">
            <BookOpen size={24} /> Lumina
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {/* Section title optional, but good for grouping if needed later. For now, flat list. */}
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Menu
          </div>
          
          {visibleLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm lg:text-base font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent"
                }`}
              >
                <Icon size={active ? 20 : 18} className={active ? "text-indigo-600" : "text-zinc-400"} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Auth Node / User Profile) */}
        <div className="p-4 border-t border-zinc-200 shrink-0 flex items-center justify-between">
            {authNode}
        </div>
      </aside>
    </>
  );
}
