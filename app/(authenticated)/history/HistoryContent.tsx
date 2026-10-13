"use client";

import { useState, use, useEffect, useTransition } from "react";
import { Search, BookOpen, Clock, CheckCircle2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDisplayDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { BorrowingRecord } from "@/lib/actions/history";
import { LuminaTable, type LuminaColumn } from "@/components/common/LuminaTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { type UserRole } from "@/lib/auth-helpers";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { CompactPagination } from "@/components/ui/compact-pagination";
import { Skeleton } from "@/components/ui/skeleton";


interface HistoryContentProps {
  historyPromise: Promise<{ records: BorrowingRecord[]; totalCount: number }>;
  page: number;
  statusFilter: string;
  searchQuery: string;
  userRole: UserRole;
}


export function HistorySkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4 p-2 rounded-xl border border-border/60 bg-card/40">
        <Skeleton className="h-10 w-full sm:max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function HistoryContent({
  historyPromise,
  page,
  statusFilter,
  searchQuery,
  userRole,
}: HistoryContentProps) {

  const { records, totalCount } = use(historyPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();

  // Realtime refresh
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('history-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'borrowing_records' }, 
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const updateFilters = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    startTransition(() => {
      router.push(`/history?${params.toString()}`);
    });
  };

  const formatDate = (dateStr: string) => formatDisplayDate(dateStr);

  const isOverdue = (record: BorrowingRecord) => {
    return record.status?.toUpperCase() === "OVERDUE" || (record.status?.toUpperCase() === "ACTIVE" && new Date(record.due_date) < new Date());
  };

  const viewParam = searchParams.get("view");
  const isPrivileged = (userRole === "super_admin" || 
                        userRole === "librarian" || 
                        userRole === "student_assistant") && 
                       viewParam === "logs";

  const columns: LuminaColumn<BorrowingRecord>[] = [
    ...(isPrivileged
      ? [
          {
            header: "Borrower",
            accessor: (record: BorrowingRecord) => (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  {record.profiles?.full_name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider tabular-nums">
                  {record.profiles?.student_id ||
                    record.profiles?.email?.split("@")[0] ||
                    "No ID"}
                </span>
              </div>
            ),
          },
        ]
      : []),
    {
      header: "Resource",

      accessor: (record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:bg-background transition-colors">
            {record.books?.title?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-foreground">
                {record.books?.title || "Unknown Title"}
              </p>
              {record.status?.toUpperCase() === 'RETURNED' && (
                <CheckCircle2 size={14} className="text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="truncate text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {record.books?.author || "Internal Entity"}
            </p>
          </div>
        </div>
      ),
      mobileMain: true
    },
    {
      header: "Borrowed",
      accessor: (record) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground tabular-nums">{formatDate(record.borrowed_at)}</span>
        </div>
      )
    },
    {
      header: "Timeline",
      accessor: (record) => {
        const overdue = isOverdue(record);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock size={14} className={cn("text-muted-foreground", overdue && "text-destructive")} />
              <span className={cn("text-xs font-semibold tabular-nums", overdue ? "text-destructive" : "text-foreground")}>
                Due {formatDate(record.due_date)}
              </span>
            </div>
            {record.returned_at && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider tabular-nums">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                Returned {formatDate(record.returned_at)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Status",
      accessor: (record) => {
        const overdue = isOverdue(record);
        return <StatusBadge status={overdue ? "OVERDUE" : record.status} />;
      }
    }
  ];

  const filterControls = (
    <div className="flex flex-wrap items-center justify-between gap-4 w-full">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          updateFilters({ q: localSearch, page: 1 });
        }}
        className="relative w-full sm:max-w-xs"
      >
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          type="text"
          placeholder="Search timeline..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-10 rounded-lg pl-9 bg-background border border-border/60 focus:bg-background transition-all text-xs font-semibold"
        />
      </form>
      <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-lg border border-border/60">
        {(["all", "ACTIVE", "RETURNED", "OVERDUE"] as const).map((status) => (
          <button
            key={status}
            onClick={() => updateFilters({ status, page: 1 })}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              statusFilter === status
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {status === "all" ? "All" : status.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AdminTableShell
      controls={filterControls}
      pagination={
        totalCount > 0 ? (
          <CompactPagination
            page={page}
            totalItems={totalCount}
            pageSize={10}
            onPageChange={(p) => updateFilters({ page: p })}
            variant="ghost"
          />
        ) : null
      }
      className={cn(
        "max-w-none animate-in fade-in-50 duration-300 transition-opacity",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <LuminaTable
        data={records}
        columns={columns}
        noBorder
        emptyState={{
          title: searchQuery || statusFilter !== "all" ? "No matches found" : "Timeline empty",
          description: searchQuery || statusFilter !== "all" 
            ? "Try reframing your search strategy." 
            : isPrivileged 
              ? "No borrowing records exist in the system yet."
              : "Your borrowing history will appear here.",
          icon: BookOpen,
          action: {
            label: "Clear All Filters",
            onClick: () => updateFilters({ q: "", status: "all", page: 1 })
          }
        }}
      />
    </AdminTableShell>
  );
}

