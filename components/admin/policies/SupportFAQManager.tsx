"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit3, HelpCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Manages the FAQ / Knowledge Base items for policy support.
 * Designed with a high-fidelity, premium administrative aesthetic.
 */
export function SupportFAQManager({ 
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
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const currentFaqs = useMemo(() => {
    try {
      return value ? (JSON.parse(value) as { question: string; answer: string }[]) : [];
    } catch { return []; }
  }, [value]);

  const initialFaqs = useMemo(() => {
    try {
      return initialValue ? (JSON.parse(initialValue) as { question: string; answer: string }[]) : [];
    } catch { return []; }
  }, [initialValue]);

  const removedFaqs = useMemo(() => {
    return initialFaqs.filter(init => !currentFaqs.some(curr => curr.question === init.question));
  }, [currentFaqs, initialFaqs]);

  const MAX_Q_LENGTH = 120;
  const MAX_A_LENGTH = 600;

  const addOrUpdateFAQ = () => {
    if (!newQ.trim() || !newA.trim()) return;
    if (newQ.length > MAX_Q_LENGTH || newA.length > MAX_A_LENGTH) return;
    
    let updated;
    if (editingIndex !== null) {
      updated = [...currentFaqs];
      updated[editingIndex] = { question: newQ.trim(), answer: newA.trim() };
      setEditingIndex(null);
    } else {
      updated = [...currentFaqs, { question: newQ.trim(), answer: newA.trim() }];
    }
    
    onChange(JSON.stringify(updated));
    setNewQ("");
    setNewA("");
    setIsModalOpen(false);
  };

  const removeFAQ = (index: number) => {
    const updated = currentFaqs.filter((_, i) => i !== index);
    onChange(JSON.stringify(updated));
  };

  const restoreFAQ = (faq: { question: string; answer: string }) => {
    const updated = [...currentFaqs, faq];
    onChange(JSON.stringify(updated));
  };

  const startEdit = (index: number) => {
    setNewQ(currentFaqs[index].question);
    setNewA(currentFaqs[index].answer);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const startAdd = () => {
    setNewQ("");
    setNewA("");
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const isNew = (faq: { question: string; answer: string }) => {
    return !initialFaqs.some(init => init.question === faq.question);
  };

  const isModified = (faq: { question: string; answer: string }) => {
    const initial = initialFaqs.find(init => init.question === faq.question);
    return initial && initial.answer !== faq.answer;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Knowledge Base
          </p>
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {currentFaqs.length} entries registered
          </p>
        </div>
        {!disabled && (
          <Button 
            onClick={startAdd}
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg gap-2 text-primary hover:bg-primary/10 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {currentFaqs.length === 0 && !disabled && (
          <EmptyState
            icon={HelpCircle}
            title="No entries found"
            description="Add common questions and answers to assist patrons with library policies."
            className="border-dashed border-border/60 bg-card/40 rounded-xl"
            contentClassName="min-h-[160px] py-6 sm:py-8"
          />
        )}

        <div className="grid gap-3">
          {currentFaqs.map((faq, i) => {
            const added = isNew(faq);
            const modified = isModified(faq);
            return (
                <div key={`curr-${i}`} className={cn(
                  "group/faq relative rounded-xl border p-4 transition-colors",
                  added ? "bg-primary/5 border-primary/20" : 
                  modified ? "status-warning" :
                  "bg-card/40 border-border/60 hover:bg-muted/20 hover:border-border"
                )}>
                  <div className="flex justify-between gap-6">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-border/60",
                          added || modified ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-muted/20 text-muted-foreground"
                        )}>
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground tracking-tight line-clamp-1">{faq.question}</p>
                        {added && (
                          <span className="text-xs text-primary font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">New</span>
                        )}
                        {modified && (
                          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md status-warning">Edited</span>
                        )}
                      </div>
                    <div className="flex gap-3 items-start pl-11">
                      <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium line-clamp-2">{faq.answer}</p>
                    </div>
                  </div>
                  {!disabled && (
                    <div className="flex gap-1.5 opacity-0 group-hover/faq:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30" onClick={() => startEdit(i)}>
                        <Edit3 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeFAQ(i)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {removedFaqs.length > 0 && (
          <div className="mt-8 space-y-4 pt-8 border-t border-border/60">
             <div className="flex items-center gap-2 px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Removal</p>
             </div>
             <div className="grid gap-3">
                {removedFaqs.map((faq, i) => (
                   <div key={`rem-${i}`} className="group/rem relative rounded-xl border border-border/60 bg-card/40 p-4 opacity-60 hover:opacity-100 transition-opacity">
                     <div className="flex justify-between gap-6">
                       <div className="min-w-0 flex-1">
                         <p className="text-xs font-bold text-muted-foreground line-through tracking-tight mb-1">Q: {faq.question}</p>
                         <p className="text-xs text-muted-foreground leading-relaxed line-through italic font-medium">A: {faq.answer}</p>
                       </div>
                       {!disabled && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 border border-border/60 transition-colors shrink-0" 
                            onClick={() => restoreFAQ(faq)}
                          >
                            <Plus size={14} />
                          </Button>
                       )}
                     </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border/60 shadow-xl rounded-xl bg-background">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  {editingIndex !== null ? "Edit FAQ" : "Add FAQ"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Knowledge Base Entry
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 pt-2 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question
                </Label>
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  newQ.length > MAX_Q_LENGTH ? "text-destructive" : "text-muted-foreground/60"
                )}>
                  {newQ.length}/{MAX_Q_LENGTH}
                </span>
              </div>
              <Input
                placeholder="How do I borrow a book?"
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                disabled={disabled}
                className={cn(
                  "h-10 rounded-lg border border-border/60 bg-background text-xs px-3 font-medium placeholder:text-muted-foreground/50",
                  newQ.length > MAX_Q_LENGTH && "border-destructive/60 bg-destructive/5"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Answer
                </Label>
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  newA.length > MAX_A_LENGTH ? "text-destructive" : "text-muted-foreground/60"
                )}>
                  {newA.length}/{MAX_A_LENGTH}
                </span>
              </div>
              <Textarea
                placeholder="Enter the detailed answer here..."
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                disabled={disabled}
                className={cn(
                  "min-h-[120px] rounded-lg border border-border/60 bg-background text-xs p-3 resize-none leading-relaxed font-medium placeholder:text-muted-foreground/50",
                  newA.length > MAX_A_LENGTH && "border-destructive/60 bg-destructive/5"
                )}
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-3">
             <Button 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-10 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={addOrUpdateFAQ}
                disabled={disabled || !newQ.trim() || !newA.trim() || newQ.length > MAX_Q_LENGTH || newA.length > MAX_A_LENGTH}
                className="flex-[2] h-10 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors"
              >
                {editingIndex !== null ? "Save Changes" : "Add Entry"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

