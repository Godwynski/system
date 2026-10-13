"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Archive, Check, RotateCcw, Hash, Type, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/types/admin";

interface CategoryItemProps {
  category: Category;
  draftCategory?: Category;
  isBulkEditing: boolean;
  isChanged: boolean;
  onDraftChange?: (field: keyof Category, value: string) => void;
  onEdit?: (category: Category) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
}

/**
 * A single category entry in the management list.
 * Supports standard display, archived states, and inline bulk editing.
 */
export function CategoryItem({
  category,
  draftCategory,
  isBulkEditing,
  isChanged,
  onDraftChange,
  onEdit,
  onArchive,
  onRestore,
}: CategoryItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4 transition-colors",
        isBulkEditing && isChanged && "border-primary/40 bg-primary/5",
        !category.is_active && !isBulkEditing && "opacity-60 bg-muted/20",
        "hover:bg-muted/20 hover:border-border"
      )}
    >
      <div className="flex-1 min-w-0">
        {isBulkEditing && draftCategory && onDraftChange ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                <Type className="h-3 w-3" />
                Display Name
              </label>
              <Input
                value={draftCategory.name}
                onChange={(e) => onDraftChange("name", e.target.value)}
                className="h-10 rounded-lg bg-background border border-border/60 text-xs font-semibold"
                placeholder="Category Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                URL Identifier
              </label>
              <Input
                value={draftCategory.slug}
                onChange={(e) => onDraftChange("slug", e.target.value)}
                className="h-10 rounded-lg bg-background border border-border/60 text-xs font-mono font-semibold"
                placeholder="slug-identifier"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                <AlignLeft className="h-3 w-3" />
                Description
              </label>
              <Input
                value={draftCategory.description || ""}
                onChange={(e) => onDraftChange("description", e.target.value)}
                className="h-10 rounded-lg bg-background border border-border/60 text-xs font-medium"
                placeholder="Optional description"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              {!category.is_active && (
                <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Archived
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/60">
                {category.slug}
              </p>
              {category.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[400px]">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 ml-6">
        {!isBulkEditing && onEdit && onArchive && (
          <>
            <Button
              onClick={() => onEdit(category)}
              size="sm"
              variant="outline"
              className="h-8 w-8 rounded-lg p-0 border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {category.is_active ? (
              <Button
                onClick={() => onArchive(category.id)}
                size="sm"
                variant="outline"
                className="h-8 w-8 rounded-lg p-0 border border-border/60 bg-background text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors"
                title="Archive category"
              >
                <Archive className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onRestore && onRestore(category.id)}
                size="sm"
                variant="outline"
                className="h-8 w-8 rounded-lg p-0 border border-border/60 bg-background text-muted-foreground hover:text-status-success hover:border-status-success/30 hover:bg-status-success/10 transition-colors"
                title="Restore category"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        {isBulkEditing && isChanged && (
          <div className="h-8 flex items-center justify-center px-3 rounded-lg status-success border border-border/60 text-xs font-semibold uppercase tracking-wider">
            <Check className="h-3.5 w-3.5 mr-1.5" />
            <span>Modified</span>
          </div>
        )}
      </div>
    </div>
  );
}

