'use client';

import { use, useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Library, Users, ArrowUpRight } from 'lucide-react';
import { TrendChart, CategoryPieChart, PeakHoursBarChart, ChartSkeleton } from './AnalyticsCharts';
import { getAnalyticsSummary, type AnalyticsSummary, type AnalyticsRange } from '@/lib/actions/analytics';
import { BookDetailModal } from '@/components/catalog/BookDetailModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type DashboardStats = {
  activeBorrows: number;
  pendingApprovals: number;
  myActiveBorrows: number;
  recentBooks: { id: string; title: string; author: string; cover_url: string | null; created_at: string }[];
  attendanceToday: number;
  totalBooks: number;
  totalUsers: number;
};

interface AnalyticsProps {
  statsPromise: Promise<DashboardStats>;
  role: 'super_admin' | 'librarian';
}

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '1 Year', value: '1y' },
];

export function AnalyticsClient({ statsPromise, role }: AnalyticsProps) {
  const stats = use(statsPromise);
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getAnalyticsSummary(range);
      setSummary(data);
    } catch {
      toast.error("Failed to load analytics data");
    }
  }, [range]);

  useEffect(() => {
    startTransition(() => {
      loadSummary();
    });
  }, [loadSummary]);

  // Real-time Subscriptions via Supabase CDC
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('analytics-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        loadSummary();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrowing_records' }, () => {
        loadSummary();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSummary]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Circulation & Collection Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time patron footfall, circulation velocity, and inventory demand metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground border border-border/60 bg-muted/20 px-2.5 py-1.5 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>

          {/* Time Window Switcher */}
          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/60">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  range === r.value 
                    ? "bg-foreground text-background shadow-xs font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional KPI Strip (Unified architectural strip, not generic separate cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-border/70 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border/50 shadow-xs overflow-hidden">
        {[
          { 
            label: "Daily Traffic", 
            value: stats.attendanceToday, 
            icon: Clock, 
            desc: "Attendance check-ins today",
            href: "/attendance"
          },
          { 
            label: "Active Borrows", 
            value: stats.activeBorrows, 
            icon: BookOpen, 
            desc: "Circulating off-shelf",
            href: "/history?status=ACTIVE"
          },
          { 
            label: "Total Collection", 
            value: stats.totalBooks, 
            icon: Library, 
            desc: "Accessioned physical volumes",
            href: "/inventory"
          },
          { 
            label: "Registered Patrons", 
            value: stats.totalUsers, 
            icon: Users, 
            desc: "Active student & staff accounts",
            href: "/users"
          },
        ].map((stat, i) => (
          <Link 
            key={i} 
            href={stat.href}
            className="group p-5 hover:bg-muted/30 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span className="font-semibold uppercase tracking-wider font-mono">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground block">
                {stat.value.toLocaleString()}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {stat.desc}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-foreground shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Primary Visualizations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden">
          {!summary ? (
            <ChartSkeleton title="Peak Visiting Hours" />
          ) : (
            <PeakHoursBarChart 
              data={summary.peakHours} 
              title="Peak Visiting Hours" 
            />
          )}
          {isPending && summary && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
        </div>

        <div className="relative overflow-hidden">
          {!summary ? (
            <ChartSkeleton title="Circulation Trends" />
          ) : (
            <TrendChart 
              data={summary.borrowingTrends} 
              title="Circulation Trends" 
              href="/history"
            />
          )}
          {isPending && summary && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
        </div>
      </section>

      {/* Deep Collection Telemetry */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Category Distribution Breakdown */}
        <div className="lg:col-span-5 flex flex-col">
          {summary ? (
            <CategoryPieChart data={summary.categoryDistribution} title="Genre & Classification" />
          ) : (
            <ChartSkeleton title="Genre & Classification" />
          )}
        </div>

        {/* High Demand Catalog Ledger */}
        <div className="lg:col-span-7 rounded-xl border border-border/70 bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  High-Demand Volumes
                </h3>
                <p className="text-xs text-muted-foreground">
                  Most frequently circulated titles in this period
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Ranked by borrows
              </span>
            </div>

            <div className="divide-y divide-border/30">
              {summary ? (
                summary.popularBooks.length > 0 ? (
                  summary.popularBooks.slice(0, 5).map((book, i) => (
                    <button 
                      key={book.id || i} 
                      type="button"
                      onClick={() => {
                        setSelectedBookId(book.id);
                        setModalOpen(true);
                      }}
                      className="w-full text-left py-3 px-2 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors rounded-lg group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-muted-foreground/60 w-5">
                          0{i + 1}
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {book.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground shrink-0">
                        <span className="font-bold text-foreground">{book.count}</span>
                        <span>checkouts</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No borrowing transactions recorded during this interval.
                  </div>
                )
              ) : (
                <div className="space-y-3 py-3 animate-pulse">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="h-8 bg-muted/30 rounded w-full" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Click any title to view copy availability & catalog details</span>
            <Link href="/catalog" className="hover:text-foreground font-medium transition-colors">
              Full Catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* Book Detail Modal */}
      {selectedBookId && (
        <BookDetailModal
          bookId={selectedBookId}
          open={modalOpen}
          onOpenChange={setModalOpen}
          variant="super_admin"
          canManage={role === 'super_admin'}
        />
      )}
    </div>
  );
}
