import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BookOpen } from 'lucide-react';

/**
 * Tier 1: Feature Coverage of Design Tokens, Hairline Borders, Status Colors, and Core Surfaces.
 * Specification Authority: DESIGN.md, PROJECT.md, and globals.css
 */
describe('Tier 1: Design System Tokens & Surface Harmonization', () => {

  describe('1.1 Root Design Tokens & CSS Variables (globals.css)', () => {
    const globalsCssPath = path.resolve(process.cwd(), 'app/globals.css');
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');

    it('defines root radius token as 0.5rem (8px baseline)', () => {
      // Rationale: --radius: 0.5rem ensures Tailwind rounded-lg = 8px and rounded-xl = 12px
      expect(globalsCss).toMatch(/--radius:\s*0\.5rem;/);
    });

    it('defines institutional semantic status color tokens', () => {
      // Success Forest: hsl(142 72% 32%) / #15803d
      expect(globalsCss).toMatch(/--status-success:\s*142\s+72%\s+32%;/);
      // Warning Amber: hsl(38 92% 38%) / #b45309
      expect(globalsCss).toMatch(/--status-warning:\s*38\s+92%\s+38%;/);
      // Critical/Danger Crimson: hsl(0 72% 44%) / #dc2626
      expect(globalsCss).toMatch(/--status-danger:\s*0\s+72%\s+44%;/);
      // Neutral Muted: hsl(215 16% 38%) / #64748b
      expect(globalsCss).toMatch(/--status-neutral:\s*215\s+16%\s+38%;/);
    });

    it('exports canonical status utility classes with opacity borders and backgrounds', () => {
      expect(globalsCss).toContain('.status-success');
      expect(globalsCss).toContain('.status-warning');
      expect(globalsCss).toContain('.status-danger');
      expect(globalsCss).toContain('.status-neutral');
    });
  });

  describe('1.2 Typography System Contract (DESIGN.md)', () => {
    const designMdPath = path.resolve(process.cwd(), 'DESIGN.md');
    const designMd = fs.readFileSync(designMdPath, 'utf-8');

    it('enforces Manrope as the universal font family across all typographic tiers', () => {
      expect(designMd).toContain('fontFamily: "Manrope, sans-serif"');
      expect(designMd).toContain('Display Font:** Manrope');
      expect(designMd).toContain('Body Font:** Manrope');
    });

    it('documents the 5-tier typographic hierarchy', () => {
      // Display: clamp(2rem, 5vw, 3rem), 700
      expect(designMd).toContain('clamp(2rem, 5vw, 3rem)');
      // Headline: 1.75rem / 28px, 700
      expect(designMd).toContain('1.75rem');
      // Title: 1.25rem / 20px, 600
      expect(designMd).toContain('1.25rem');
      // Body: 0.875rem / 14px, 400
      expect(designMd).toContain('0.875rem');
      // Label: 0.75rem / 12px, 600
      expect(designMd).toContain('0.75rem');
    });

    it('mandates tabular-nums for numeric and ledger scannability', () => {
      expect(designMd).toContain('font-variant-numeric: tabular-nums');
      expect(designMd).toContain('tabular numerals for ISBNs, barcode scans');
    });
  });

  describe('1.3 Radius Scale: Controls (8px / rounded-lg) vs Containers (12px / rounded-xl)', () => {
    it('Button controls use rounded-lg on default, sm, and lg sizes', () => {
      const { rerender } = render(<Button size="default">Action</Button>);
      const defaultBtn = screen.getByRole('button', { name: 'Action' });
      expect(defaultBtn.className).toContain('rounded-lg');

      rerender(<Button size="sm">Small Action</Button>);
      const smBtn = screen.getByRole('button', { name: 'Small Action' });
      expect(smBtn.className).toContain('rounded-lg');

      rerender(<Button size="lg">Large Action</Button>);
      const lgBtn = screen.getByRole('button', { name: 'Large Action' });
      expect(lgBtn.className).toContain('rounded-lg');
    });

    it('Badge controls use rounded-lg', () => {
      render(<Badge>Institutional Badge</Badge>);
      const badge = screen.getByText('Institutional Badge');
      expect(badge.className).toContain('rounded-lg');
    });

    it('Input controls use rounded-lg', () => {
      render(<Input placeholder="Search catalog..." />);
      const input = screen.getByPlaceholderText('Search catalog...');
      expect(input.className).toContain('rounded-lg');
    });

    it('Card containers use rounded-xl (12px)', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Circulation Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card.className).toContain('rounded-xl');
    });

    it('DialogContent containers use rounded-xl (12px)', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Circulation Policy</DialogTitle>
            <DialogDescription>Policy details modal.</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('rounded-xl');
    });
  });

  describe('1.4 Hairline Borders & Crisp Boundary Rule', () => {
    it('Cards enforce subtle hairline borders', () => {
      render(<Card data-testid="crisp-card">Card Content</Card>);
      const card = screen.getByTestId('crisp-card');
      expect(card.className).toMatch(/border\s+border-border/);
    });

    it('DialogContent enforces 1px hairline border with border-border/60', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Crisp Modal</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('border');
      expect(dialog.className).toContain('border-border/60');
    });

    it('Button outline variant enforces crisp input border without heavy glow', () => {
      render(<Button variant="outline">Outline Action</Button>);
      const btn = screen.getByRole('button', { name: 'Outline Action' });
      expect(btn.className).toContain('border');
      expect(btn.className).toContain('border-input');
    });
  });

  describe('1.5 Semantic Status Colors & The Status Purpose Rule', () => {
    it('StatusBadge correctly maps operational status AVAILABLE to status-success', () => {
      render(<StatusBadge status="AVAILABLE" />);
      const badge = screen.getByText('Available');
      expect(badge.className).toContain('status-success');
    });

    it('StatusBadge correctly maps operational status BORROWED to status-warning', () => {
      render(<StatusBadge status="BORROWED" />);
      const badge = screen.getByText('Borrowed');
      expect(badge.className).toContain('status-warning');
    });

    it('StatusBadge correctly maps operational status LOST to status-danger', () => {
      render(<StatusBadge status="LOST" />);
      const badge = screen.getByText('Lost');
      expect(badge.className).toContain('status-danger');
    });

    it('StatusBadge correctly maps operational status OVERDUE to status-danger', () => {
      render(<StatusBadge status="OVERDUE" />);
      const badge = screen.getByText('Overdue');
      expect(badge.className).toContain('status-danger');
    });

    it('StatusBadge correctly maps operational status READY to status-success', () => {
      render(<StatusBadge status="READY" />);
      const badge = screen.getByText('Ready');
      expect(badge.className).toContain('status-success');
    });
  });

  describe('1.6 Core Surfaces: EmptyState and Skeleton Primitives', () => {
    it('EmptyState renders with structured icon container, heading, description, and button', () => {
      const handleAction = () => {};
      render(
        <EmptyState
          icon={BookOpen}
          title="No Books in Circulation"
          description="There are currently no active circulation loans recorded in the system."
          action={{
            label: "Issue New Loan",
            onClick: handleAction,
          }}
        />
      );

      expect(screen.getByText('No Books in Circulation')).toBeInTheDocument();
      expect(screen.getByText('There are currently no active circulation loans recorded in the system.')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /Issue New Loan/i });
      expect(actionBtn).toBeInTheDocument();
      expect(actionBtn.className).toContain('rounded-lg');
      expect(actionBtn.className).toContain('bg-primary');
    });

    it('Skeleton renders with animate-pulse and background accent', () => {
      render(<Skeleton data-testid="table-skeleton" className="h-6 w-32" />);
      const skeleton = screen.getByTestId('table-skeleton');
      expect(skeleton.className).toContain('animate-pulse');
      expect(skeleton.className).toContain('bg-accent');
    });
  });
});
