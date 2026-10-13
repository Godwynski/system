"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,

  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Layers, Type, Hash, AlignLeft, ShieldCheck } from "lucide-react";
import { cn, toSlug } from "@/lib/utils";


interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  formData: CategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSave: () => void;
  loading: boolean;
  error: string | null;
}


/**
 * Dialog for creating or editing a single category entry.
 */
export function CategoryDialog({
  isOpen,
  onOpenChange,
  editingId,
  formData,
  setFormData,
  onSave,
  loading,
  error,
}: CategoryDialogProps) {
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border border-border/60 bg-background p-0 shadow-xl sm:max-w-md overflow-hidden">
        <div className="p-6 space-y-6">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Layers className="h-5 w-5" />
              </div>
              <div className="px-2.5 py-0.5 rounded-md bg-muted/40 border border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Registry System
              </div>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                {editingId ? "Update Category" : "Register Category"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingId ? "Modify existing registry parameters" : "Initialize a new classification node"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Type className="h-3 w-3" />
                  Display Label
                </Label>
                <span className={cn(
                  "text-xs tabular-nums",
                  formData.name.length > 50 ? "text-destructive font-semibold" : "text-muted-foreground/60"
                )}>
                  {formData.name.length}/50
                </span>
              </div>
              <Input
                id="name"
                placeholder="e.g. Theoretical Physics"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => {
                    const nextName = e.target.value;
                    return {
                      ...p,
                      name: nextName,
                      slug: toSlug(p.slug ? p.slug : nextName),
                    };
                  })
                }
                disabled={loading}
                className={cn(
                  "h-10 rounded-lg bg-background border border-border/60 text-xs font-semibold placeholder:text-muted-foreground/50",
                  formData.name.length > 50 && "border-destructive/60 bg-destructive/5"
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  URL Identifier
                </Label>
                <span className={cn(
                  "text-xs tabular-nums",
                  formData.slug.length > 60 ? "text-destructive font-semibold" : "text-muted-foreground/60"
                )}>
                  {formData.slug.length}/60
                </span>
              </div>
              <Input
                id="slug"
                placeholder="e.g. theoretical-physics"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, slug: toSlug(e.target.value) }))
                }
                disabled={loading}
                className={cn(
                  "h-10 rounded-lg bg-background border border-border/60 text-xs font-mono font-semibold placeholder:text-muted-foreground/50",
                  formData.slug.length > 60 && "border-destructive/60 bg-destructive/5"
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlignLeft className="h-3 w-3" />
                  Meta Description
                </Label>
                <span className={cn(
                  "text-xs tabular-nums",
                  formData.description.length > 200 ? "text-destructive font-semibold" : "text-muted-foreground/60"
                )}>
                  {formData.description.length}/200
                </span>
              </div>
              <Input
                id="description"
                placeholder="Brief summary of this classification category..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                disabled={loading}
                className={cn(
                  "h-10 rounded-lg bg-background border border-border/60 text-xs font-medium placeholder:text-muted-foreground/50",
                  formData.description.length > 200 && "border-destructive/60 bg-destructive/5"
                )}
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            disabled={loading}
            className="flex-1 h-10 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={
              loading || 
              formData.name.length > 50 || 
              formData.slug.length > 60 || 
              formData.description.length > 200 ||
              !formData.name.trim()
            }
            className="flex-[2] h-10 rounded-lg text-xs font-semibold uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            {editingId ? "Update Category" : "Save Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

