'use client';

import { 
    AlertCircle, 
    Calendar, 
    CheckCircle2, 
    FileText, 
    ShieldAlert, 
    User 
} from 'lucide-react';

interface ReviewStepProps {
  type: 'checkout' | 'return';
  studentName: string;
  studentId: string;
  bookTitle: string;
  dueDate: string;
  borrowedAt?: string;
}

export function ReviewStep({ 
  type, 
  studentName, 
  studentId, 
  bookTitle, 
  dueDate, 
  borrowedAt 
}: ReviewStepProps) {
  const isCheckout = type === 'checkout';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          {isCheckout ? <FileText className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 status-success !bg-transparent !border-0" />}
          {isCheckout ? 'Review Checkout' : 'Review Return'}
        </h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          {isCheckout 
            ? 'Verify borrower and item details.' 
            : 'Confirm item return details.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border border-border/60">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Borrower</p>
                <p className="text-sm font-semibold text-foreground">{studentName}</p>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border border-border/60">
               <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                 <ShieldAlert className="h-3.5 w-3.5" />
                 ID Verification
               </p>
               <p className="mt-1 font-mono text-xl font-bold tracking-widest text-foreground tabular-nums">
                 {studentId}
               </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4 h-full">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resource</p>
              <p className="text-sm font-semibold mt-1 text-foreground leading-tight">{bookTitle}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border/60">
              {borrowedAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3 w-3" />
                    BORROWED
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">{borrowedAt}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3 w-3" />
                  DUE DATE
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {dueDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="status-warning border rounded-lg p-3 flex items-start gap-3">
         <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
         <p className="text-xs font-semibold leading-normal uppercase tracking-wider">
           Once confirmed, this transaction is recorded. Ensure the physical copy matches.
         </p>
      </div>
    </div>
  );
}
