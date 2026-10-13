'use client'

import { Ticket } from 'lucide-react'

interface SimulationProps {
  formData: Record<string, string>;
}

/**
 * Component for simulating policy changes and visualizing the projected borrowing lifecycle.
 */
export function PolicySimulationPanel({ formData }: SimulationProps) {
  const holdExpiry = parseInt(formData.hold_expiry_days || '7')

  return (
    <div className="w-full space-y-10 p-1">
      <div className="p-5 rounded-xl border border-border/60 bg-card/40 flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
          <Ticket className="h-4 w-4" />
        </div>
        <div className="space-y-1 pt-0.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hold Period</h4>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {holdExpiry} Day Reservation
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed tabular-nums">
            Items are held for {holdExpiry} days before expiration.
          </p>
        </div>
      </div>
    </div>
  );
}
