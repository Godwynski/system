import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowRight, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_POLICIES } from "@/lib/actions/policy-constants";

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  changedKeys: string[];
  initialValues: Record<string, string>;
  formData: Record<string, string>;
  loading: boolean;
}

/**
 * A dialog to review and confirm system policy changes with an audit reason.
 */
export function PolicyCommitModal({
  isOpen,
  onClose,
  onConfirm,
  changedKeys,
  initialValues,
  formData,
  loading
}: CommitModalProps) {
  const [reason, setReason] = useState("");

  const formatKey = (key: string) => 
    key.split('_')
       .map(w => w.charAt(0).toUpperCase() + w.slice(1))
       .join(' ')
       .replace("Loan", "Borrow");

  const renderDiffDetails = (key: string, oldVal: string, newVal: string) => {
    if (oldVal === newVal) return null;
    
    // Check if it's a JSON array (like FAQs)
    if ((oldVal?.startsWith("[") && oldVal?.endsWith("]")) || (newVal?.startsWith("[") && newVal?.endsWith("]"))) {
      try {
        const oldArr = oldVal ? JSON.parse(oldVal) : [];
        const newArr = newVal ? JSON.parse(newVal) : [];
        
        if (Array.isArray(oldArr) && Array.isArray(newArr)) {
          const added = newArr.filter(newItem => !oldArr.some(oldItem => JSON.stringify(oldItem) === JSON.stringify(newItem)));
          const removed = oldArr.filter(oldItem => !newArr.some(newItem => JSON.stringify(newItem) === JSON.stringify(oldItem)));
          
          if (added.length === 0 && removed.length === 0) {
             return <span className="text-xs text-muted-foreground italic font-medium">Reordered collection items</span>;
          }

          const getLabel = (item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>;
              return String(obj.question ?? obj.name ?? obj.title ?? JSON.stringify(item));
            }
            return String(item);
          };

          return (
            <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
              {added.map((item: unknown, i: number) => (
                <div key={`add-${i}`} className="flex items-start gap-2 text-xs text-status-success font-semibold leading-tight">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-status-success shrink-0" />
                  <span className="line-clamp-2">Added: {getLabel(item)}</span>
                </div>
              ))}
              {removed.map((item: unknown, i: number) => (
                <div key={`rem-${i}`} className="flex items-start gap-2 text-xs text-destructive font-medium leading-tight italic">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />
                  <span className="line-through decoration-destructive/30 line-clamp-2">Removed: {getLabel(item)}</span>
                </div>
              ))}
            </div>
          );
        }
      } catch {
        // Fallback to string diff
      }
    }

    // Default string diff
    return (
      <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
        <span className="text-muted-foreground line-through truncate max-w-[140px] font-medium">{oldVal || "Empty"}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-primary truncate max-w-[180px] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
          {newVal || "Empty"}
        </span>
      </div>
    );
  };

  const isFormValid = reason.trim().length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] md:max-h-[85vh] flex flex-col border border-border/60 bg-background rounded-xl p-0 overflow-hidden shadow-xl">
        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Check className="h-5 w-5" />
              </div>
              <div className="px-2.5 py-0.5 rounded-md bg-primary/10 text-xs font-semibold uppercase tracking-wider text-primary border border-primary/20">
                Draft Changes
              </div>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">Review Updates</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                You are about to commit <span className="text-foreground font-semibold">{changedKeys.length}</span> modifications to the system policies.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className={cn(
              "max-h-[160px] md:max-h-[220px] overflow-y-auto space-y-3 custom-scrollbar pr-1 shrink-0",
              "scrollbar-thin scrollbar-thumb-muted-foreground/10"
            )}>
              {changedKeys.map(key => (
                <div key={key} className="group relative p-3.5 rounded-xl bg-card border border-border/60 hover:border-border transition-colors shadow-xs flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                      {DEFAULT_POLICIES[key]?.label ?? formatKey(key)}
                    </span>
                    {renderDiffDetails(key, initialValues[key], formData[key])}
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audit Protocol Reason
                </label>
                <span className={cn(
                  "text-xs font-semibold uppercase transition-colors",
                  isFormValid ? "text-status-success font-semibold" : "text-amber-600 dark:text-amber-400"
                )}>
                  {reason.length < 10 ? `${10 - reason.length} chars min` : 'Validated'}
                </span>
              </div>
              <div className="relative group">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for these changes for the audit log..."
                  className="min-h-[100px] rounded-lg border border-border/60 bg-background text-xs font-medium p-3 resize-none placeholder:text-muted-foreground/50"
                />
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md status-warning text-xs font-semibold uppercase tracking-wider">
                  <Info className="h-3 w-3" />
                  <span>Permanent Log</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-lg text-xs font-semibold uppercase tracking-wider border-border/60 hover:bg-muted/40 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={loading || !isFormValid}
            className="flex-[1.5] h-10 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing
              </div>
            ) : "Confirm & Commit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
