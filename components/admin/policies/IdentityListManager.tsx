"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ListRestart, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Manages collections of identity-based strings (e.g. Student IDs, Emails).
 * Refined with a high-fidelity, premium administrative aesthetic.
 */
export function IdentityListManager({ 
  value, 
  initialValue,
  onChange, 
  disabled 
}: { 
  value: string; 
  initialValue: string;
  onChange: (val: string) => void; 
  disabled: boolean; 
}) {
  const [newItem, setNewItem] = useState("");
  
  const currentItems = useMemo(() => {
    try {
      if (value.startsWith("[") && value.endsWith("]")) {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(i => typeof i === "string") : [];
      }
      return value.split(",").map(i => i.trim()).filter(Boolean);
    } catch {
      return value.split(",").map(i => i.trim()).filter(Boolean);
    }
  }, [value]);

  const initialItems = useMemo(() => {
    try {
      if (initialValue.startsWith("[") && initialValue.endsWith("]")) {
        const parsed = JSON.parse(initialValue);
        return Array.isArray(parsed) ? parsed.filter(i => typeof i === "string") : [];
      }
      return initialValue.split(",").map(i => i.trim()).filter(Boolean);
    } catch {
      return initialValue.split(",").map(i => i.trim()).filter(Boolean);
    }
  }, [initialValue]);

  const removedItems = useMemo(() => {
    return initialItems.filter(init => !currentItems.includes(init));
  }, [currentItems, initialItems]);

  const MAX_ITEM_LENGTH = 50;

  const addItem = () => {
    if (!newItem.trim() || currentItems.includes(newItem.trim())) return;
    if (newItem.length > MAX_ITEM_LENGTH) return;
    const updated = [...currentItems, newItem.trim()];
    onChange(JSON.stringify(updated));
    setNewItem("");
  };

  const removeItem = (item: string) => {
    const updated = currentItems.filter(i => i !== item);
    onChange(JSON.stringify(updated));
  };

  const restoreItem = (item: string) => {
    const updated = [...currentItems, item];
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap gap-2 min-h-[44px] p-4 rounded-xl bg-card/40 border border-border/60">
        {currentItems.map((item, i) => {
          const isAdded = !initialItems.includes(item);
          return (
            <Badge 
              key={`${item}-${i}`} 
              variant="secondary" 
              className={cn(
                "group/badge h-8 pl-3 pr-1 py-0 rounded-lg text-xs font-semibold tabular-nums tracking-wide transition-colors border",
                isAdded 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "bg-background text-muted-foreground border-border/60 hover:border-border"
              )}
            >
              <Hash className="h-3 w-3 mr-1.5 opacity-40 group-hover/badge:opacity-70 transition-opacity" />
              {item}
              <button
                onClick={() => removeItem(item)}
                disabled={disabled}
                className="ml-2 h-5 w-5 rounded-md flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </Badge>
          );
        })}
        
        {removedItems.map((item, i) => (
          <Badge 
            key={`rem-${item}-${i}`} 
            variant="outline" 
            className="h-8 pl-3 pr-1 py-0 rounded-lg text-xs font-semibold tabular-nums tracking-wide bg-muted/20 text-muted-foreground/50 border-border/60 line-through opacity-80 hover:opacity-100"
          >
            {item}
            <button
              onClick={() => restoreItem(item)}
              disabled={disabled}
              className="ml-2 h-5 w-5 rounded-md flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
            >
              <ListRestart size={12} />
            </button>
          </Badge>
        ))}

        {currentItems.length === 0 && removedItems.length === 0 && (
          <EmptyState
            icon={Hash}
            title="No identifiers configured"
            description="Add student IDs or email addresses to this access policy list."
            className="border-dashed border-border/60 bg-card/40 rounded-xl"
            contentClassName="min-h-[140px] py-4 sm:py-6"
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
            {currentItems.length} Items
          </p>
          {newItem.length > 0 && (
            <p className={cn(
              "text-xs font-semibold tabular-nums",
              newItem.length > MAX_ITEM_LENGTH ? "text-destructive" : "text-muted-foreground/60"
            )}>
              {newItem.length} / {MAX_ITEM_LENGTH} Chars
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 group/input">
            <Input
              placeholder="Add identifier..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
              disabled={disabled}
              className={cn(
                "h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold px-3 placeholder:text-muted-foreground/50",
                newItem.length > MAX_ITEM_LENGTH && "border-destructive/60 bg-destructive/5"
              )}
            />
          </div>
          <Button
            type="button"
            onClick={addItem}
            disabled={disabled || !newItem.trim() || newItem.length > MAX_ITEM_LENGTH}
            className="h-10 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

