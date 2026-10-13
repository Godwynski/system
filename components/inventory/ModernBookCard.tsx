"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { 
  MapPin, 
  Layers, 
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Book } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BookDetailModal } from "@/components/catalog/BookDetailModal";

import { BookCover } from "@/components/ui/book-cover";

interface ModernBookCardProps {
  book: Book;
  priority?: boolean;
  canManage?: boolean;
}

export function ModernBookCard({ book, priority = false, canManage = true }: ModernBookCardProps) {
  const isOutOfStock = book.available_copies === 0;
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        className="group h-full block w-full text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <m.div
          layout
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3.5 transition-all group-hover:bg-accent/40 group-hover:border-border/80 shadow-xs"
        >
          <div className="mb-3 flex items-start gap-3.5">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {book.title}
                </h3>
                <p className="mt-1 truncate text-xs font-medium text-muted-foreground">by {book.author}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                  <MapPin size={12} className="text-primary/70 shrink-0" />
                  <span className="font-semibold uppercase tracking-wider text-2xs text-muted-foreground/70 shrink-0">Location:</span>
                  <span className="truncate text-foreground/90 font-medium">{book.location || "Central Shelf"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Layers size={12} className="text-primary/70 shrink-0" />
                  <span className="font-semibold uppercase tracking-wider text-2xs text-muted-foreground/70 shrink-0">ISBN:</span>
                  <span className="truncate font-mono text-foreground/80">{book.isbn || "INTERNAL-STOCK"}</span>
                </div>
                {book.dewey_decimal && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <Tag size={12} className="text-primary/70 shrink-0" />
                    <span className="font-semibold uppercase tracking-wider text-2xs text-muted-foreground/70 shrink-0">DDC:</span>
                    <span className="truncate font-mono text-foreground/80">{book.dewey_decimal}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30 shadow-xs transition-transform duration-300 group-hover:scale-105">
              <BookCover
                src={book.cover_url}
                alt={book.title}
                priority={priority}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
                   <span className="text-2xs font-bold uppercase tracking-wider text-destructive border border-destructive/50 px-1.5 py-0.5 rounded bg-background/90">OUT</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              {!book.is_active ? (
                <Badge variant="outline" className="rounded-md px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-300/40">
                  Archived
                </Badge>
              ) : (
                <Badge 
                  variant={isOutOfStock ? "destructive" : "secondary"} 
                  className={cn(
                    "rounded-md px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider transition-colors",
                    !isOutOfStock && "bg-muted text-muted-foreground border border-border/40 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent"
                  )}
                >
                  {book.available_copies} / {book.total_copies} In Pool
                </Badge>
              )}
            </div>
            <span className="text-2xs font-mono font-medium uppercase tracking-wider text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
              {book.section || "General"}
            </span>
          </div>

          {/* Tactile progress bar at the bottom */}
          <div className="absolute bottom-0 left-0 h-1 w-full bg-muted/20">
            <m.div 
              initial={{ width: 0 }}
              animate={{ width: `${(book.available_copies / (book.total_copies || 1)) * 100}%` }}
              className={`h-full transition-colors duration-500 ${isOutOfStock ? "bg-destructive" : "bg-primary group-hover:bg-primary-foreground"}`}
            />
          </div>
        </m.div>
      </div>

      <BookDetailModal
        bookId={book.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        variant="super_admin"
        initialData={book}
        canManage={canManage}
      />
    </>
  );
}
