'use client';

import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Library, 
  Users, 
  ScrollText, 
  Settings, 
  RefreshCw, 
  BookOpen, 
  UserCheck, 
  BarChart3, 
  AlertTriangle, 
  ArrowRight, 
  BookMarked,
  ShieldCheck,
  Plus,
  ScanLine
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cancelReservation } from '@/lib/actions/reservations';
import { toast } from 'sonner';
import { useTransition, useMemo, useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { resolveStudentId, getDeterministicQrUrl } from "@/lib/library-card-assets";
import { DEFAULT_STUDENT_FAQS } from "@/lib/actions/policy-constants";
import { createClient } from '@/lib/supabase/client';
import { Reservation, ProfileData, Book, Category } from '@/lib/types';
import type { BorrowingRecord } from '@/lib/actions/history';

import { LiveActivityTicker } from './LiveActivityTicker';
import { BookDetailModal } from '@/components/catalog/BookDetailModal';
import { EmptyState } from '@/components/ui/empty-state';
import { BookCover } from '@/components/ui/book-cover';
import { ActivitySection } from './ActivitySection';
import { SupportSection } from './SupportSection';

const MyCardContainer = dynamic(() => import('@/components/library/MyCardContainer'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted" />
});

type CardData = { card_number: string; status: string; expires_at: string } | null;
type FaqRow = { key: string; value: string | null };

type DashboardStats = {
  activeBorrows: number;
  pendingApprovals: number;
  myActiveBorrows: number;
  recentBooks: { id: string; title: string; author: string; cover_url: string | null; created_at: string }[];
  activeBorrowsList?: BorrowingRecord[];
  attendanceToday: number;
  totalBooks: number;
  totalUsers: number;
  archivedBooks?: number;
  archivedUsers?: number;
  overdueBorrows: number;
  readyHolds: number;
};

interface DashboardProps {
  user: User;
  role: string | null;
  statsPromise: Promise<DashboardStats>;
  profilePromise: Promise<{ data: ProfileData | null }>;
  cardPromise: Promise<{ data: CardData }>;
  faqPromise: Promise<{ data: FaqRow[] | null }>;
  reservationsPromise: Promise<Reservation[]>;
  inventoryBooksPromise: Promise<{ data: Book[]; count: number }>;
  inventoryCategoriesPromise: Promise<Category[]>;
  preferredView?: string;
  activeAttendance?: { id: string; check_in_at: string } | null;
  attendanceLogs: { id: string; check_in_at: string; check_out_at: string | null }[];
}

export function DashboardClient({ 
  user, 
  role, 
  statsPromise, 
  profilePromise, 
  cardPromise, 
  faqPromise, 
  reservationsPromise,
  inventoryBooksPromise,
  inventoryCategoriesPromise,
  activeAttendance,
  attendanceLogs
}: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      router.refresh();
    }, 500);
  }, [router]);
  
  // Unwrap promises using 'use' hook
  const stats = use(statsPromise);
  const profileResult = use(profilePromise);
  const cardResult = use(cardPromise);
  const faqResult = use(faqPromise);
  const reservations = use(reservationsPromise);
  const inventoryData = use(inventoryBooksPromise);
  use(inventoryCategoriesPromise);
  
  const profileData = profileResult.data;
  const activeBorrowsList = useMemo(() => stats.activeBorrowsList || [], [stats.activeBorrowsList]);

  useEffect(() => {
    // Unique channel name to avoid collisions
    const channelName = `dashboard-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      // Student-specific data with filters for efficiency
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'borrowing_records',
        filter: `user_id=eq.${user.id}`
      }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reservations',
        filter: `user_id=eq.${user.id}`
      }, () => {
        debouncedRefresh();
      })
      // General data that affects the dashboard
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_cards' }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance',
        filter: `user_id=eq.${user.id}`
      }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        debouncedRefresh();
      })
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      void supabase.removeChannel(channel);
    };
  }, [supabase, debouncedRefresh, user.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { studentCard, studentFaqs } = useMemo(() => {
    let card = null;
    let faqs = [...DEFAULT_STUDENT_FAQS];

    if (profileData) {
      const studentCardData = cardResult.data;
      const faqRows = faqResult.data;

      const resolvedStudentId = resolveStudentId({
        studentId: profileData.student_id,
        fallbackEmail: user.email,
        userId: user.id,
        role: role,
      });

      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const startYear = now.getUTCMonth() >= 5 ? currentYear : currentYear - 1;
      const ayString = `${startYear} - ${startYear + 1}`;
      
      const expiresAt = studentCardData?.expires_at || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

      card = {
        fullName: profileData.full_name || "Student",
        studentId: resolvedStudentId || profileData.student_id || "N/A",
        cardNumber: studentCardData?.card_number || "Pending assignment",
        department: profileData.department || "General",
        status: ((studentCardData?.status?.toLowerCase() || profileData.status?.toLowerCase()) as "active" | "pending" | "suspended" | "expired") || "pending",
        expiryDate: expiresAt,
        academicYear: ayString,
        avatarUrl: profileData.avatar_url,
        qrUrl: resolvedStudentId ? getDeterministicQrUrl(resolvedStudentId) : null,
        address: profileData.address || undefined,
        phone: profileData.phone || undefined,
        roleLabel: role ? role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Student",
      };

      if (faqRows && faqRows.length > 0) {
        const listRow = faqRows.find(row => row.key === "student_faq_list");
        if (listRow?.value) {
          try {
            faqs = JSON.parse(listRow.value);
          } catch (e) {
            console.error("Failed to parse FAQs", e);
          }
        }
      }
    }
    return { studentCard: card, studentFaqs: faqs };
  }, [profileData, cardResult, faqResult, user, role]);

  const handleCancelReservation = (id: string, title: string) => {
    startTransition(async () => {
      try {
        const res = await cancelReservation(id);
        if (res.success) {
          toast.success(`Reservation for "${title}" cancelled.`);
          router.refresh();
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Cancellation failed");
      }
    });
  };

  const initialData = useMemo(() => {
    if (!selectedBookId) return undefined;
    const resBook = reservations.find(r => r.books?.id === selectedBookId)?.books;
    if (resBook) return resBook as Book;
    const borrowBook = activeBorrowsList.find(b => b.books?.id === selectedBookId)?.books;
    if (borrowBook) return borrowBook as Book;
    return inventoryData.data?.find(b => b.id === selectedBookId);
  }, [selectedBookId, reservations, activeBorrowsList, inventoryData.data]);

  const hasAnyPermission = role === "student_assistant"
    ? !!(profileData?.permissions?.manage_circulation || profileData?.permissions?.manage_attendance || profileData?.permissions?.view_admin_dashboard)
    : true;

  // =========================================================================
  // VIEW 1: UNIFIED STAFF DASHBOARD (ADMINISTRATORS & LIBRARIANS)
  // =========================================================================
  if (role === "super_admin" || role === "librarian") {
    const isOverdue = stats.overdueBorrows > 0;
    const isPendingApprovals = stats.pendingApprovals > 0;
    const isReadyHolds = stats.readyHolds > 0;
    const hasActions = isOverdue || isPendingApprovals || isReadyHolds;

    // Filter quick shortcuts dynamically based on role
    const quickShortcuts = [
      {
        title: "Circulation Desk",
        desc: "Checkout & return books",
        path: "/circulation",
        icon: RefreshCw,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: true,
      },
      {
        title: "Book Inventory",
        desc: "Manage book collections",
        path: "/inventory",
        icon: BookMarked,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: true,
      },
      {
        title: "User Directory",
        desc: "Approve cards & profiles",
        path: "/users",
        icon: Users,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: true,
      },
      {
        title: "Visitor Logs",
        desc: "Track library attendance",
        path: "/attendance",
        icon: UserCheck,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: true,
      },
      {
        title: "System Analytics",
        desc: "View usage statistics",
        path: "/analytics",
        icon: BarChart3,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: true,
      },
      {
        title: "Audit Trail",
        desc: "Track database changes",
        path: "/audit",
        icon: ScrollText,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: role === 'super_admin',
      },
      {
        title: "Settings & Policies",
        desc: "Adjust system parameters",
        path: "/policies",
        icon: Settings,
        color: "group-hover:border-primary/30",
        iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        show: role === 'super_admin',
      },
    ].filter(item => item.show);

    const totalActionsCount = (isPendingApprovals ? stats.pendingApprovals : 0) + 
                              (isOverdue ? stats.overdueBorrows : 0) + 
                              (isReadyHolds ? stats.readyHolds : 0);

    return (
      <div className="space-y-8 pb-14 overflow-x-hidden relative text-left">
        <LiveActivityTicker />

        {/* ==================== INSTITUTIONAL HEADER ==================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Institutional Operations
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {role === 'super_admin' ? 'Super Administrator' : 'Librarian'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Circulation triage, catalog governance, and operational command dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground border border-border/60 bg-muted/20 px-2.5 py-1.5 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Kiosk Active
            </span>

            {/* Quick Operational Jump Buttons */}
            <Link
              href="/circulation"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors shadow-2xs"
            >
              <ScanLine size={13} className="text-primary" />
              <span>Circulation Desk</span>
            </Link>

            <Link
              href="/inventory/add"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus size={13} />
              <span>Catalog Volume</span>
            </Link>
          </div>
        </div>

        {/* ==================== ACTION & TRIAGE CENTER ==================== */}
        <section className="space-y-3">
          <div className="border border-border/60 bg-card/40 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${hasActions ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action Center
                </span>
              </div>
              <span className="text-2xs font-mono text-muted-foreground">
                {hasActions ? `${totalActionsCount} Pending Items` : "0 Pending Items"}
              </span>
            </div>

            {!hasActions ? (
              <div className="flex items-center gap-3 p-3.5 bg-muted/20 rounded-lg border border-border/30">
                <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  All administrative queues cleared. No pending card verifications or overdue escalations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isPendingApprovals && (
                  <Card 
                    role="button"
                    onClick={() => router.push('/users')}
                    className="group border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-3.5 flex items-center justify-between rounded-xl shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Card Applications</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <span className="font-semibold text-foreground font-mono">{stats.pendingApprovals}</span> pending review
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Card>
                )}

                {isOverdue && (
                  <Card 
                    role="button"
                    onClick={() => router.push('/history?view=logs&status=OVERDUE')}
                    className="group border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-3.5 flex items-center justify-between rounded-xl shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:scale-105 transition-transform shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Overdue Borrows</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <span className="font-semibold text-foreground font-mono">{stats.overdueBorrows}</span> books outstanding
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Card>
                )}

                {isReadyHolds && (
                  <Card 
                    role="button"
                    onClick={() => router.push('/circulation')}
                    className="group border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-3.5 flex items-center justify-between rounded-xl shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                        <BookMarked size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Holds Ready</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <span className="font-semibold text-foreground font-mono">{stats.readyHolds}</span> waiting for pickup
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Card>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ==================== SYSTEM METRICS LEDGER STRIP ==================== */}
        <section>
          <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              <button
                type="button"
                onClick={() => router.push('/attendance')}
                className="p-5 sm:p-6 text-left hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider">Today&apos;s Visitors</span>
                  <UserCheck className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {stats.attendanceToday}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kiosk gate entries logged
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push('/history?view=logs&status=ACTIVE')}
                className="p-5 sm:p-6 text-left hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider">Active Loans</span>
                  <RefreshCw className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {stats.activeBorrows}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Circulated collection items
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push('/inventory')}
                className="p-5 sm:p-6 text-left hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider">Catalog Volumes</span>
                  <BookMarked className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {stats.totalBooks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Physical titles in catalog
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push('/users')}
                className="p-5 sm:p-6 text-left hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider">Patron Directory</span>
                  <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrolled student & staff accounts
                </p>
              </button>
            </div>
          </div>
        </section>

        {/* ==================== HOLDINGS & GOVERNANCE LEDGER ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Collection Status */}
          <div className="border border-border/60 bg-card/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Collection Holdings & Capacity
                </h3>
              </div>
              <Link href="/inventory" className="text-xs font-medium text-primary hover:underline">
                Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Active Titles</span>
                <p className="text-xl font-bold font-mono text-foreground">{stats.totalBooks}</p>
                <p className="text-xs text-muted-foreground">Cataloged & searchable</p>
              </div>

              <div className="space-y-1">
                <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Archived Titles</span>
                <p className="text-xl font-bold font-mono text-muted-foreground">{stats.archivedBooks ?? 0}</p>
                <p className="text-xs text-muted-foreground">Decommissioned items</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Circulation Velocity Ratio:</span>
              <span className="text-foreground font-semibold">
                {stats.totalBooks > 0 ? Math.round((stats.activeBorrows / stats.totalBooks) * 100) : 0}% of collection deployed
              </span>
            </div>
          </div>

          {/* Patron Community & Risk */}
          <div className="border border-border/60 bg-card/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Governance & Compliance
                </h3>
              </div>
              <Link href="/history?view=logs&status=OVERDUE" className="text-xs font-medium text-primary hover:underline">
                Overdue Ledger →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Overdue Rate</span>
                <p className="text-xl font-bold font-mono text-destructive">
                  {stats.activeBorrows > 0 ? Math.round((stats.overdueBorrows / stats.activeBorrows) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{stats.overdueBorrows} delinquent loans</p>
              </div>

              <div className="space-y-1">
                <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Patron Roster</span>
                <p className="text-xl font-bold font-mono text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">{stats.archivedUsers ?? 0} archived accounts</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Security Governance:</span>
              <span className="text-foreground font-semibold">
                Audit Trail Active
              </span>
            </div>
          </div>
        </section>

        {/* ==================== SYSTEM SHORTCUTS GRID ==================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Command Shortcuts
            </h2>
            <span className="text-2xs font-mono text-muted-foreground">Quick Access</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {quickShortcuts.map((shortcut) => (
              <Card 
                key={shortcut.path}
                role="button"
                onClick={() => router.push(shortcut.path)}
                className="group border border-border/60 bg-card/40 shadow-xs hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-4 flex items-center gap-3.5 rounded-xl"
              >
                <div className="p-2.5 rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 shrink-0">
                  <shortcut.icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{shortcut.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{shortcut.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ==================== RECENTLY CATALOGED BOOKS ==================== */}
        <section className="space-y-3">
          <div className="border border-border/60 bg-card/40 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recently Cataloged Volumes
                </span>
              </div>
              <Link href="/inventory" className="text-xs font-medium text-primary hover:underline">
                Full Catalog →
              </Link>
            </div>
            {stats.recentBooks.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No recent collection additions"
                description="New volumes added to the library collection will appear here."
                className="border-dashed border-border/60 bg-card/40"
                contentClassName="min-h-[200px] py-8"
              />
            ) : (
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {stats.recentBooks.map((book) => (
                  <Card 
                    key={book.id}
                    role="button"
                    onClick={() => {
                      setSelectedBookId(book.id);
                      setModalOpen(true);
                    }}
                    className="group border border-border/60 bg-card/60 hover:bg-muted/30 hover:border-border/80 shadow-xs transition-all cursor-pointer flex flex-col p-3 rounded-xl"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border/40 bg-muted/30 shadow-2xs mb-2.5 group-hover:scale-[1.02] transition-transform">
                      <BookCover 
                        src={book.cover_url} 
                        alt={book.title} 
                      />
                    </div>
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {book.title}
                    </p>
                    <p className="truncate text-2xs text-muted-foreground mt-0.5">
                      {book.author}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Administrative Book Detail Modal with Full Management Controls */}
        <BookDetailModal
          bookId={selectedBookId || ''}
          open={modalOpen}
          onOpenChange={setModalOpen}
          variant="super_admin"
          canManage={true}
          initialData={initialData}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNIFIED STUDENT DASHBOARD (STUDENT & ACTIVE STUDENT ASSISTANTS)
  // =========================================================================
  const isAssistant = role === "student_assistant" && profileData?.status?.toUpperCase() === "ACTIVE" && hasAnyPermission;
  const hasCirculationPerm = !!profileData?.permissions?.manage_circulation;
  const hasAttendancePerm = !!profileData?.permissions?.manage_attendance;

  return (
    <div className="space-y-8 pb-14 overflow-x-hidden relative text-left">
      <LiveActivityTicker />

      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Patron Workspace
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Digital credential, active collection loans, and reserve queue status.
          </p>
        </div>
      </div>

      {/* ==================== LIBRARY CARD CONTAINER ==================== */}
      <section className="grid gap-6 items-start">
        <Card className="border border-border/60 bg-card/40 shadow-xs overflow-hidden relative p-5 sm:p-7 rounded-xl">
          {studentCard ? (
            <div className="space-y-4">
              <MyCardContainer initialData={studentCard} variant="dashboard" />
              {activeAttendance && (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Currently Timed In</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-300">
                    Since {new Date(activeAttendance.check_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Library size={44} className="text-muted-foreground/30 mb-3" />
              <h2 className="text-base font-semibold text-muted-foreground">No Digital Card Assigned</h2>
              <p className="text-xs text-muted-foreground mt-1">Please visit the circulation desk to activate your institutional card.</p>
            </div>
          )}
        </Card>
      </section>

      {/* ==================== ASSISTANT DESK TOOLBAR (SA ONLY) ==================== */}
      {isAssistant && (
        <section className="space-y-3">
          <div className="border border-border/60 bg-card/40 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assistant Desk Shortcuts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {hasCirculationPerm && (
                <Card 
                  role="button"
                  onClick={() => router.push('/circulation')}
                  className="group border border-border/60 bg-card/60 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-4 flex items-center gap-3.5 rounded-xl shadow-xs"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                    <RefreshCw size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Circulation Desk</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Checkout & return books</p>
                  </div>
                </Card>
              )}

              {hasAttendancePerm && (
                <Card 
                  role="button"
                  onClick={() => router.push('/attendance')}
                  className="group border border-border/60 bg-card/60 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-4 flex items-center gap-3.5 rounded-xl shadow-xs"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Attendance Logs</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Scanner & visitor logs</p>
                  </div>
                </Card>
              )}

              <Card 
                role="button"
                onClick={() => router.push('/student-catalog')}
                className="group border border-border/60 bg-card/60 hover:bg-muted/30 hover:border-border/80 transition-all cursor-pointer p-4 flex items-center gap-3.5 rounded-xl shadow-xs"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Book Catalog</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">Search & explore books</p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ==================== PERSONAL ACTIVITY SECTION ==================== */}
      <ActivitySection 
        activeBorrows={activeBorrowsList}
        reservations={reservations}
        attendanceLogs={attendanceLogs}
        onOpenBook={(id) => {
          setSelectedBookId(id);
          setModalOpen(true);
        }}
        onCancelReservation={handleCancelReservation}
        isPending={isPending}
        mounted={mounted}
      />

      {/* ==================== SUPPORT SECTION (FAQS) ==================== */}
      <SupportSection faqs={studentFaqs} />

      <BookDetailModal
        bookId={selectedBookId || ''}
        open={modalOpen}
        onOpenChange={setModalOpen}
        variant="student"
        initialData={initialData}
      />
    </div>
  );
}
