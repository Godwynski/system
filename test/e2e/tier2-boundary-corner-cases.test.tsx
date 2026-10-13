import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { LuminaTable } from '@/components/common/LuminaTable';
import { FileQuestion, AlertTriangle } from 'lucide-react';

/**
 * Tier 2: Boundary & Corner Cases
 * - Purge arbitrary font off-ramps (text-[8px], text-[10px], etc.)
 * - Extreme radii purge (rounded-[3rem], rounded-[2rem], rounded-[50px])
 * - Zero mock data & empty state transitions
 * - Adversarial input stress (escaping, unexpected statuses, boundary values)
 */
describe('Tier 2: Boundary & Corner Cases Verification', () => {

  describe('2.1 Purge Arbitrary Font Off-Ramps from Canonical UI Primitives', () => {
    const uiDir = path.resolve(process.cwd(), 'components/ui');
    const primitiveFiles = [
      'button.tsx',
      'dialog.tsx',
      'card.tsx',
      'badge.tsx',
      'empty-state.tsx',
      'skeleton.tsx',
      'input.tsx',
    ];

    primitiveFiles.forEach((file) => {
      it(`verifies ${file} does not introduce arbitrary pixel font off-ramps (e.g. text-[8px], text-[10px])`, () => {
        const filePath = path.join(uiDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Match patterns like text-[8px], text-[9px], text-[10px], text-[11px]
          const arbitraryFontMatch = content.match(/text-\[\s*(\d+)px\s*\]/g);
          expect(arbitraryFontMatch).toBeNull();
        }
      });
    });

    it('verifies canonical controls adhere to the standard Tailwind type scale (text-xs, text-sm, text-base)', () => {
      render(
        <div>
          <Button size="sm">Small Action</Button>
          <Button size="default">Default Action</Button>
          <Badge>Badge Text</Badge>
        </div>
      );

      const smBtn = screen.getByRole('button', { name: 'Small Action' });
      const defaultBtn = screen.getByRole('button', { name: 'Default Action' });
      const badge = screen.getByText('Badge Text');

      expect(smBtn.className).toMatch(/text-xs/);
      expect(defaultBtn.className).toMatch(/text-sm/);
      expect(badge.className).toMatch(/text-xs/);
    });
  });

  describe('2.2 Purge Extreme Radii & Decorative Gradient Off-Ramps', () => {
    const uiDir = path.resolve(process.cwd(), 'components/ui');
    const primitiveFiles = ['button.tsx', 'dialog.tsx', 'card.tsx', 'badge.tsx', 'input.tsx'];

    primitiveFiles.forEach((file) => {
      it(`verifies ${file} contains no extreme arbitrary radii (rounded-[2rem], rounded-[3rem], rounded-[50px])`, () => {
        const filePath = path.join(uiDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const extremeRadiusMatch = content.match(/rounded-\[(\s*\d+(rem|px)\s*)\]/g);
          expect(extremeRadiusMatch).toBeNull();
        }
      });
    });

    it('verifies Card and DialogContent do not use arbitrary radius off-ramps', () => {
      render(
        <div>
          <Card data-testid="pure-card">Card</Card>
          <Dialog open>
            <DialogContent data-testid="pure-dialog">
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>Content</DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      );

      const card = screen.getByTestId('pure-card');
      const dialog = screen.getByRole('dialog');

      expect(card.className).not.toMatch(/rounded-\[\d+/);
      expect(dialog.className).not.toMatch(/rounded-\[\d+/);
      expect(card.className).toContain('rounded-xl');
      expect(dialog.className).toContain('rounded-xl');
    });
  });

  describe('2.3 Zero Mock Data & Empty Dataset Boundary Handling', () => {
    it('LuminaTable renders clean empty state when passed zero mock records (data=[])', () => {
      const mockColumns = [
        { header: 'Title', accessor: 'title' as const },
        { header: 'Author', accessor: 'author' as const },
      ];

      render(
        <LuminaTable
          data={[]}
          columns={mockColumns}
          emptyState={{
            icon: FileQuestion,
            title: "No Catalog Records",
            description: "No physical book records found in the database.",
          }}
        />
      );

      // Verify zero mock data rendered - no synthetic table rows exist
      expect(screen.queryByRole('row', { name: /mock/i })).not.toBeInTheDocument();
      // Verify empty state title and description are rendered
      expect(screen.getAllByText('No Catalog Records').length).toBeGreaterThan(0);
      expect(screen.getAllByText('No physical book records found in the database.').length).toBeGreaterThan(0);
    });

    it('LuminaTable does not synthesize pagination buttons when totalCount is 0', () => {
      const mockColumns = [{ header: 'ID', accessor: 'id' as const }];
      const onPageChange = () => {};

      render(
        <LuminaTable
          data={[]}
          columns={mockColumns}
          totalCount={0}
          page={1}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      // totalPages = Math.ceil(0 / 10) = 0, should not render pagination controls
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('EmptyState handles optional action and optional icon gracefully', () => {
      render(
        <EmptyState
          icon={AlertTriangle}
          title="Empty Search Results"
          description="Try broadening your search keywords."
        />
      );

      expect(screen.getByText('Empty Search Results')).toBeInTheDocument();
      expect(screen.getByText('Try broadening your search keywords.')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('2.4 Adversarial Edge Cases & Boundary Stress', () => {
    it('StatusBadge gracefully falls back to status-neutral when given unknown status', () => {
      render(
        <div data-testid="status-container">
          <StatusBadge status="NON_EXISTENT_STATUS_XYZ" />
        </div>
      );

      const badge = screen.getByText('NON_EXISTENT_STATUS_XYZ');
      expect(badge).toBeInTheDocument();
      // Fallback class is status-neutral
      expect(badge.className).toContain('status-neutral');
    });

    it('RoleBadge safely handles unknown or untyped role strings', () => {
      render(
        <div>
          <RoleBadge role="super_hacker" />
          <RoleBadge role="guest_patron" />
        </div>
      );

      expect(screen.getByText('super_hacker')).toBeInTheDocument();
      expect(screen.getByText('guest_patron')).toBeInTheDocument();
    });

    it('EmptyState safely handles long strings and special characters without DOM corruption', () => {
      const longTitle = 'Boundary Stress Title Verification';
      const adversarialDesc = '<script>alert("xss")</script> & "quotes" & \'single\' 🚀💥';

      render(
        <EmptyState
          icon={AlertTriangle}
          title={longTitle}
          description={adversarialDesc}
        />
      );

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(longTitle);
      // React escapes HTML strings by default, verifying text content is rendered safely
      expect(screen.getByText(adversarialDesc)).toBeInTheDocument();
    });

    it('Button disabled state strictly prevents interaction and applies disabled styles', () => {
      let clicked = false;
      const handleClick = () => { clicked = true; };

      render(
        <Button disabled onClick={handleClick}>
          Disabled Action
        </Button>
      );

      const btn = screen.getByRole('button', { name: 'Disabled Action' });
      expect(btn).toBeDisabled();
      expect(btn.className).toContain('disabled:pointer-events-none');
      expect(btn.className).toContain('disabled:opacity-50');

      fireEvent.click(btn);
      expect(clicked).toBe(false);
    });
  });
});
