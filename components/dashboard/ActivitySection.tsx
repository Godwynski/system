'use client';

import { BookOpen, Bookmark, XCircle, Ticket, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { BorrowingRecord } from '@/lib/actions/history';
import { Reservation } from '@/lib/types';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface ActivityProps {
  activeBorrows: BorrowingRecord[];
  reservations: Reservation[];
  attendanceLogs: { id: string; check_in_at: string; check_out_at: string | null }[];
  onOpenBook: (id: string) => void;
  onCancelReservation: (id: string, title: string) => void;
  isPending: boolean;
  mounted: boolean;
}

export function ActivitySection({ 
  activeBorrows, 
  reservations, 
  attendanceLogs,
  onOpenBook, 
  onCancelReservation, 
  isPending,
  mounted 
}: ActivityProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* My Active Borrows */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Current Loans
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {activeBorrows.length} {activeBorrows.length === 1 ? 'volume' : 'volumes'}
          </span>
        </div>
        {activeBorrows.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No active loans"
            description="No active borrowed volumes in circulation."
            className="border-dashed border-border/60 bg-card/40"
            contentClassName="min-h-[160px] py-6 sm:py-8"
          />
        ) : (
          <div className="grid gap-2.5">
            {activeBorrows.map((borrow) => {
              const isOverdue = borrow.status === 'OVERDUE' || (mounted && new Date(borrow.due_date) < new Date());
              return (
                <Card 
                  key={borrow.id} 
                  role="button"
                  onClick={() => onOpenBook(borrow.books?.id || '')}
                  className="border border-border/60 bg-card/40 shadow-xs transition-all hover:bg-muted/20 hover:border-border/80 cursor-pointer group rounded-xl"
                >
                  <CardContent className="flex items-center justify-between gap-4 p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md bg-muted/40 overflow-hidden relative shadow-xs border border-border/40 group-hover:border-primary/30 transition-all">
                        <Image 
                          src={borrow.books?.cover_url || "/images/default-book-cover.png"} 
                          alt="" 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {borrow.books?.title || 'Unknown Book'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono" suppressHydrationWarning>
                          Due {mounted ? new Date(borrow.due_date).toLocaleDateString() : '...'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={isOverdue ? 'destructive' : 'outline'} 
                      className={`text-2xs font-semibold px-2 py-0.5 shrink-0 ${!isOverdue ? 'border-border/60 text-muted-foreground' : ''}`}
                    >
                      {isOverdue ? 'Overdue' : 'Active'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* My Reservations & Holds */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            Active Holds & Reserves
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {reservations.length} {reservations.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {reservations.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No reservations"
            description="No pending reservations found."
            className="border-dashed border-border/60 bg-card/40"
            contentClassName="min-h-[160px] py-6 sm:py-8"
          />
        ) : (
          <div className="grid gap-2.5">
            {reservations.map((res) => {
              const isReady = res.status === 'READY';
              return (
                <Card 
                  key={res.id} 
                  className={`relative overflow-hidden border rounded-xl shadow-xs transition-all ${
                    isReady ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60 bg-card/40'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isReady ? 'bg-emerald-500' : 'bg-primary/40'}`} />
                  <CardContent className="pl-4 pr-3.5 py-3.5 flex gap-3 items-center">
                    <div 
                      role="button"
                      onClick={() => onOpenBook(res.books?.id ?? '')}
                      className="shrink-0 group cursor-pointer"
                    >
                      <div className="relative h-12 w-8 rounded-md bg-muted/40 overflow-hidden shadow-xs border border-border/40 group-hover:border-primary/40 transition-all">
                        <Image 
                          src={res.books?.cover_url || "/images/default-book-cover.png"} 
                          alt="" 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs sm:text-sm font-semibold text-foreground leading-tight">
                        {res.books?.title || 'Unknown Book'}
                      </p>
                      <p className={`text-2xs font-semibold uppercase tracking-wider mt-0.5 ${isReady ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {isReady ? 'Ready for Desk Pickup' : `Queue Position #${res.queue_position}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button 
                        onClick={() => onCancelReservation(res.id, res.books?.title || 'Unknown Book')} 
                        disabled={isPending} 
                        className="text-2xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1 disabled:opacity-30 transition-colors"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Attendance */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Recent Attendance
          </h2>
          <Link href="/attendance" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Full Ledger <ArrowRight size={12} />
          </Link>
        </div>

        {attendanceLogs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No attendance logs"
            description="No check-in logs recorded today."
            className="border-dashed border-border/60 bg-card/40"
            contentClassName="min-h-[160px] py-6 sm:py-8"
          />
        ) : (
          <div className="grid gap-2.5">
            {attendanceLogs.map((log) => (
              <Card key={log.id} className="border border-border/60 bg-card/40 shadow-xs rounded-xl">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">
                      {mounted ? new Date(log.check_in_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '...'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xs font-semibold text-emerald-600 uppercase">In</span>
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {mounted ? new Date(log.check_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--'}
                        </span>
                      </div>
                      <div className="h-3.5 w-px bg-border/60" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xs font-semibold text-muted-foreground uppercase">Out</span>
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {log.check_out_at ? (mounted ? new Date(log.check_out_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--') : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {log.check_out_at ? (
                    <Badge variant="outline" className="text-2xs font-mono border-border/60 px-2 py-0.5">
                      {(() => {
                        const start = new Date(log.check_in_at);
                        const end = new Date(log.check_out_at);
                        const diffMs = end.getTime() - start.getTime();
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        return `${diffHrs}h ${diffMins}m`;
                      })()}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-2xs font-semibold px-2 py-0.5 animate-pulse">
                      Live
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
