'use client';

import { use, useState, useTransition, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn, getCategoryName } from '@/lib/utils';
import {
  MapPin,
  BookOpen,
  CheckCircle2,
  Clock,
  Ticket,
  CalendarDays,
  Tag,
  Hash,
  Layers,
  AlertTriangle,
  Sparkles,
  Library,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReserveTitleButton } from '@/components/common/ReserveTitleButton';
import { cancelReservation } from '@/lib/actions/reservations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface BookDetail {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  section: string | null;
  location: string | null;
  available_copies: number;
  total_copies: number;
  categories: { name?: string } | { name?: string }[] | null;
  tags: string[] | null;
}

interface AvailabilityStatus {
  nextAvailableDate: string | null;
  hasReservation: boolean;
  isReady: boolean;
  queuePosition: number | null;
  holdExpiresAt: string | null;
  reservationId: string | null;
}

interface Props {
  bookPromise: Promise<BookDetail | null>;
  availabilityPromise: Promise<AvailabilityStatus>;
  id: string;
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({
  book,
  availability,
}: {
  book: BookDetail;
  availability: AvailabilityStatus;
}) {
  const isAvailable = book.available_copies > 0;

  if (availability.isReady) {
    const deadline = availability.holdExpiresAt
      ? new Date(availability.holdExpiresAt).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : null;

    return (
      <div className="status-success rounded-xl border p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 shadow-inner">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider leading-tight">Copy Ready for Pickup</p>
          {deadline && (
            <p className="mt-0.5 text-xs font-semibold opacity-90">
              Claim at the desk by <span className="font-bold underline underline-offset-2">{deadline}</span>
            </p>
          )}
        </div>
        <div className="shrink-0 animate-pulse">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-current" />
        </div>
      </div>
    );
  }

  if (availability.hasReservation && availability.queuePosition) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 text-foreground shadow-inner">
          <Ticket className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider leading-tight text-foreground">
            Queue Position #{availability.queuePosition}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We&apos;ll notify you when a copy is assigned to you.
          </p>
        </div>
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="status-success rounded-xl border p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 shadow-inner">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider leading-tight">
            {book.available_copies} {book.available_copies === 1 ? 'copy' : 'copies'} on shelf
          </p>
          <p className="mt-0.5 text-xs opacity-90">
            Reserve to secure this title for your next visit.
          </p>
        </div>
      </div>
    );
  }

  // All copies borrowed
  const returnDate = availability.nextAvailableDate
    ? new Date(availability.nextAvailableDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="status-warning rounded-xl border p-4 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 shadow-inner">
        <Clock className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold uppercase tracking-wider leading-tight">Currently Unavailable</p>
        <p className="mt-0.5 text-xs opacity-90">
          {returnDate ? (
            <>Estimated availability <span className="font-bold underline underline-offset-2">{returnDate}</span></>
          ) : (
            'Join the queue to be first in line when a copy returns.'
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Copy Progress Bar ─────────────────────────────────────────────────────────

function CopyMeter({ available, total }: { available: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((available / total) * 100);
  const borrowed = total - available;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Copy Availability</span>
        <span className="tabular-nums">{available}/{total} free</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary inline-block" />
          <span className="tabular-nums text-foreground">{available}</span> on shelf
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" />
          <span className="tabular-nums text-foreground">{borrowed}</span> borrowed
        </span>
      </div>
    </div>
  );
}

// ─── Metadata Tile ─────────────────────────────────────────────────────────────

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card/40 p-4 shadow-none transition-all hover:bg-card/60">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="text-sm font-bold text-foreground leading-snug">{value || '—'}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StudentBookDetailClient({ bookPromise, availabilityPromise, id }: Props) {
  const router = useRouter();
  const book = use(bookPromise);
  const availability = use(availabilityPromise);
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [supabase] = useState(() => createClient());

  // Debounced router.refresh
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      router.refresh();
    }, 1500);
  }, [router]);

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`book-detail-${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'books', 
        filter: `id=eq.${id}` 
      }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'book_copies', 
        filter: `book_id=eq.${id}` 
      }, () => {
        debouncedRefresh();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reservations', 
        filter: `book_id=eq.${id}` 
      }, () => {
        debouncedRefresh();
      })
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      void supabase.removeChannel(channel);
    };
  }, [supabase, debouncedRefresh, id]);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
          <BookOpen className="h-7 w-7 text-muted-foreground/20" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground/60">Book not found</p>
          <p className="mt-1 text-xs text-muted-foreground">This title may have been removed from the catalog.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/student-catalog">
            <ArrowRight className="mr-1.5 h-3.5 w-3.5 rotate-180" />
            Back to Catalog
          </Link>
        </Button>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0;
  const categoryName = getCategoryName(book.categories);

  const handleCancelReservation = () => {
    const resId = availability.reservationId;
    if (!resId) return;
    setCancelDialogOpen(false);
    
    startTransition(async () => {
      try {
        await cancelReservation(resId);
        toast.success('Reservation cancelled', { id: 'reservation-toast' });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to cancel', { id: 'reservation-toast' });
      }
    });
  };

  const handleReserveSuccess = (_queuePosition: number, _status: 'READY' | 'ACTIVE') => {
    router.refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Status Banner ── */}
      <StatusBanner book={book} availability={availability} />

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">

        {/* Left: Cover */}
        <div className="shrink-0 mx-auto md:mx-0 space-y-4">
          <div className="relative h-[280px] w-[190px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-none">
            <Image
              src={book.cover_url || "/images/default-book-cover.png"}
              alt={book.title}
              fill
              sizes="190px"
              className="object-cover transition-transform duration-500 hover:scale-105"
              unoptimized
            />

            {/* Availability ribbon */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-center border-t border-border/60",
              availability.isReady
                ? 'status-success'
                : availability.hasReservation
                ? 'bg-primary text-primary-foreground'
                : isAvailable
                ? 'status-success'
                : 'status-warning'
            )}>
              {availability.isReady
                ? '✦ Ready for Pickup'
                : availability.hasReservation
                ? `Queue #${availability.queuePosition ?? 1}`
                : isAvailable
                ? 'On Shelf'
                : 'Fully Borrowed'}
            </div>
          </div>

          {/* Tags below cover */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 w-[190px]">
              {book.tags.slice(0, 4).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-border/60">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {book.tags.length > 4 && (
                <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-border/60 text-muted-foreground">
                  +{book.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Title & Author */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">{book.title}</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground/70">{book.author}</p>
          </div>

          {/* Copy Meter */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-none">
            <CopyMeter available={book.available_copies} total={book.total_copies} />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <MetaTile
              icon={Hash}
              label="ISBN"
              value={<span className="font-mono text-xs tabular-nums">{book.isbn || 'N/A'}</span>}
            />
            <MetaTile
              icon={Layers}
              label="Category"
              value={categoryName || 'Uncategorized'}
            />
            <MetaTile
              icon={MapPin}
              label="Shelf Location"
              value={book.section || 'General'}
            />
            <MetaTile
              icon={Library}
              label="Section"
              value={book.location || book.section || 'Main Floor'}
            />
          </div>

          {/* Pickup Deadline (only if READY) */}
          {availability.isReady && availability.holdExpiresAt && (
            <div className="status-success flex items-center gap-3 rounded-xl border p-4">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  Pick up by{' '}
                  {new Date(availability.holdExpiresAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  After this date, your hold will expire and the next person in queue will be notified.
                </p>
              </div>
            </div>
          )}

          {/* Return date hint (only if unavailable and no personal reservation) */}
          {!isAvailable && !availability.hasReservation && availability.nextAvailableDate && (
            <div className="status-warning flex items-center gap-3 rounded-xl border p-4">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <p className="text-xs opacity-90">
                A copy is expected to be returned by{' '}
                <span className="font-bold underline underline-offset-2">
                  {new Date(availability.nextAvailableDate).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                . Reserve now to be first in line.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <ReserveTitleButton
              bookId={id}
              isAvailable={isAvailable}
              hasExistingReservation={availability.hasReservation}
              isReady={availability.isReady}
              queuePosition={availability.queuePosition}
              holdExpiresAt={availability.holdExpiresAt}
              nextAvailableDate={availability.nextAvailableDate}
              onReserveSuccess={handleReserveSuccess}
              className="h-10 px-6 text-xs font-semibold rounded-lg shadow-sm"
            />
            {availability.hasReservation && (
              <Button
                variant="outline"
                size="default"
                disabled={isPending}
                onClick={() => setCancelDialogOpen(true)}
                className="h-10 px-5 text-xs font-semibold rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                {isPending ? 'Cancelling…' : 'Cancel Reservation'}
              </Button>
            )}
          </div>

          {/* Cancel Confirmation Dialog */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-xl border border-border/60 bg-background shadow-xl">
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center">Cancel Reservation?</DialogTitle>
                <DialogDescription className="text-center">
                  {availability.isReady ? (
                    <>
                      Your copy of <span className="font-semibold text-foreground">&ldquo;{book.title}&rdquo;</span> is currently held for you.
                      Cancelling will release it back to the shelf for anyone to borrow.
                    </>
                  ) : (
                    <>
                      You&apos;ll lose your queue position for <span className="font-semibold text-foreground">&ldquo;{book.title}&rdquo;</span>. You can always reserve again later.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 sm:justify-center pt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none rounded-lg">
                    Keep Reservation
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleCancelReservation}
                  disabled={isPending}
                  className="flex-1 sm:flex-none rounded-lg"
                >
                  {isPending ? 'Cancelling…' : 'Yes, Cancel'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Help hints */}
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Can&apos;t find the book?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the shelf label first, then scan adjacent call numbers. Ask staff at the desk to check the return queue.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Borrow Policy
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check your dashboard for borrow periods and current borrowing status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
