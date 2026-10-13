"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CompactPaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  variant?: "default" | "ghost";
}

export function CompactPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  variant = "ghost",
}: CompactPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 transition-all duration-300",
      variant === "default" && "rounded-xl border border-border/60 bg-card/40 p-2 shadow-xs",
      variant === "ghost" && "px-1"
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground tabular-nums">
          Showing <span className="font-semibold text-foreground">{start}-{end}</span> of <span className="font-semibold text-foreground">{totalItems}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {pageSizeOptions && onPageSizeChange ? (
          <div className="flex items-center gap-2 pr-2 border-r border-border/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Per Page</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="h-7 w-14 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors text-xs font-semibold tabular-nums shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[5rem] rounded-xl border border-border/60 shadow-lg">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs font-medium tabular-nums py-2">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-muted/30 border border-border/60 tabular-nums">
            <span className="text-xs font-semibold text-foreground">{page}</span>
            <span className="text-xs font-medium text-muted-foreground/60">/</span>
            <span className="text-xs font-medium text-muted-foreground">{totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
