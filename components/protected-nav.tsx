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
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 bg-zinc-950 border-b border-white/10 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-semibold text-lg text-zinc-100">{moduleName}</span>
        </div>
        {authNode}
      </header>

      {/* Desktop Top Bar */}
      <header className="hidden md:flex sticky top-0 z-50 items-center justify-between h-16 px-6 bg-zinc-950 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link href="/protected" className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <BookOpen size={24} /> Lumina
          </Link>
          <nav className="flex items-center gap-1">
            {visibleLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-zinc-300">{moduleName}</span>
          <div className="w-px h-6 bg-white/10" />
          {authNode}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <nav
            className="fixed inset-y-0 left-0 w-[280px] bg-zinc-950 border-r border-white/10 p-4 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl px-2 py-4 mb-2 border-b border-white/10">
              <BookOpen size={24} /> Lumina
            </div>
            <div className="flex flex-col gap-1">
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
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
