'use client';

import { CheckCircle2, RefreshCcw, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessStepProps {
  title: string;
  message: string;
  onReset: () => void;
  reservationReady?: boolean;
  reservedFor?: string;
}

export function SuccessStep({ title, message, onReset, reservationReady, reservedFor }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <div className="relative">
        <div className="h-16 w-16 rounded-full status-success border flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          {message}
        </p>
      </div>

      {reservationReady && (
        <div className="w-full max-w-sm bg-card/40 border border-border/60 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-muted rounded-lg p-2.5 text-foreground border border-border/60">
            <Bookmark className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hold Fulfillment</p>
            <p className="text-xs font-semibold text-foreground leading-tight mt-0.5 uppercase tracking-wider">Place on Hold Shelf</p>
            <p className="text-xs text-muted-foreground truncate">{reservedFor || 'Reserved Student'}</p>
          </div>
        </div>
      )}

      <Button 
        onClick={onReset}
        className="h-10 rounded-lg px-8 bg-primary font-semibold text-xs uppercase tracking-wider"
      >
        <RefreshCcw className="mr-2 h-3.5 w-3.5" />
        Process Another
      </Button>
    </div>
  );
}
