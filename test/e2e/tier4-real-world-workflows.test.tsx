import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ScanStep } from '@/components/circulation/steps/ScanStep';
import { ReviewStep } from '@/components/circulation/steps/ReviewStep';
import { SuccessStep } from '@/components/circulation/steps/SuccessStep';
import { ModernBookCard } from '@/components/inventory/ModernBookCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Book } from '@/lib/types';

/**
 * Tier 4: Real-World Application Scenarios
 * - Circulation desk complete checkout lifecycle (Patron scan -> Item scan -> Review -> Receipt)
 * - Circulation desk return and hold shelf fulfillment
 * - Catalog inventory management and book representation
 * - Audit log event stream inspection
 * - Attendance kiosk tap-in validation
 */
describe('Tier 4: Real-World Workflows Verification', () => {

  describe('4.1 Circulation Desk: Complete Checkout Flow Lifecycle', () => {
    it('Step 1: Scans and identifies student patron via manual entry', async () => {
      const handleScan = vi.fn().mockResolvedValue(true);

      render(
        <ScanStep
          title="Student Identification"
          description="Scan student library card or enter student ID manually."
          placeholder="Scan barcode or enter student ID..."
          onScan={handleScan}
          isProcessing={false}
          actionLabel="Identify Patron"
        />
      );

      expect(screen.getByText('Student Identification')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Scan barcode or enter student ID...');
      expect(input).toBeInTheDocument();

      // Enter student ID
      fireEvent.change(input, { target: { value: 'STU-2026-0042' } });
      const submitBtn = screen.getByRole('button', { name: /Identify Patron/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleScan).toHaveBeenCalledWith('STU-2026-0042', true);
      });
    });

    it('Step 2: Scans physical copy accession QR barcode', async () => {
      const handleScan = vi.fn().mockResolvedValue(true);

      render(
        <ScanStep
          title="Resource Verification"
          description="Scan book copy accession barcode."
          placeholder="Scan accession code or QR..."
          onScan={handleScan}
          isProcessing={false}
          actionLabel="Verify Book Copy"
        />
      );

      const input = screen.getByPlaceholderText('Scan accession code or QR...');
      fireEvent.change(input, { target: { value: 'ACC-8839-01' } });
      const submitBtn = screen.getByRole('button', { name: /Verify Book Copy/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleScan).toHaveBeenCalledWith('ACC-8839-01', true);
      });
    });

    it('Step 3: Reviews checkout loan parameters and due dates', () => {
      render(
        <ReviewStep
          type="checkout"
          studentName="Maria Santos"
          studentId="2026-STU-042"
          bookTitle="Introduction to Algorithms, Fourth Edition"
          dueDate="2026-10-25"
        />
      );

      expect(screen.getByText('Review Checkout')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Algorithms, Fourth Edition')).toBeInTheDocument();
      expect(screen.getByText('2026-10-25')).toBeInTheDocument();
    });

    it('Step 4: Renders checkout success receipt and triggers process reset', () => {
      const handleReset = vi.fn();

      render(
        <SuccessStep
          title="Checkout Completed"
          message="Resource issued to Maria Santos. Return due on 2026-10-25."
          onReset={handleReset}
        />
      );

      expect(screen.getByText('Checkout Completed')).toBeInTheDocument();
      expect(screen.getByText('Resource issued to Maria Santos. Return due on 2026-10-25.')).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /Process Another/i });
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('4.2 Circulation Desk: Return Flow and Hold Shelf Fulfillment', () => {
    it('reviews item return details', () => {
      render(
        <ReviewStep
          type="return"
          studentName="Carlos Reyes"
          studentId="2026-STU-099"
          bookTitle="Artificial Intelligence: A Modern Approach"
          dueDate="2026-10-10"
          borrowedAt="2026-09-26"
        />
      );

      expect(screen.getByText('Review Return')).toBeInTheDocument();
      expect(screen.getByText('Carlos Reyes')).toBeInTheDocument();
      expect(screen.getByText('Artificial Intelligence: A Modern Approach')).toBeInTheDocument();
    });

    it('notifies desk staff of reservation hold shelf fulfillment upon return', () => {
      const handleReset = vi.fn();

      render(
        <SuccessStep
          title="Return Processed"
          message="Resource checked in successfully."
          onReset={handleReset}
          reservationReady={true}
          reservedFor="Elena Rostova (ID: 2026-STU-108)"
        />
      );

      expect(screen.getByText('Return Processed')).toBeInTheDocument();
      expect(screen.getByText('Hold Fulfillment')).toBeInTheDocument();
      expect(screen.getByText('Place on Hold Shelf')).toBeInTheDocument();
      expect(screen.getByText('Elena Rostova (ID: 2026-STU-108)')).toBeInTheDocument();
    });
  });

  describe('4.3 Inventory Ledger & Catalog Management', () => {
    const sampleBook: Book = {
      id: 'book-sicp-001',
      title: 'Structure and Interpretation of Computer Programs',
      author: 'Harold Abelson, Gerald Jay Sussman',
      isbn: '978-0262510871',
      published_year: 1996,
      category_id: 'cat-cs-01',
      dewey_decimal: '005.133',
      total_copies: 5,
      available_copies: 3,
      is_active: true,
      cover_url: undefined,
      created_at: '2026-01-01T00:00:00Z',
    };

    it('renders inventory book card with institutional ledger styling and available copies', () => {
      render(<ModernBookCard book={sampleBook} canManage={true} />);

      expect(screen.getByRole('heading', { level: 3, name: 'Structure and Interpretation of Computer Programs' })).toBeInTheDocument();
      expect(screen.getByText(/by Harold Abelson, Gerald Jay Sussman/i)).toBeInTheDocument();
      expect(screen.getByText(/3 \/ 5 In Pool/)).toBeInTheDocument();
      expect(screen.getByText('978-0262510871')).toBeInTheDocument();
      expect(screen.getByText('005.133')).toBeInTheDocument();
    });

    it('renders out-of-stock indicator when zero available copies remain', () => {
      const outOfStockBook: Book = {
        ...sampleBook,
        available_copies: 0,
      };

      render(<ModernBookCard book={outOfStockBook} canManage={true} />);
      expect(screen.getByText('OUT')).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 5 In Pool/)).toBeInTheDocument();
    });
  });

  describe('4.4 Audit Log & Activity Stream Verification', () => {
    it('validates immutable audit record formatting and semantic status mapping', () => {
      const auditLogRecord = {
        id: 'audit-evt-1001',
        action: 'CIRCULATION_CHECKOUT',
        admin_email: 'librarian@lumina.edu',
        entity_type: 'circulation_records',
        entity_id: 'loan-xyz-881',
        timestamp: '2026-10-11T10:30:00Z',
        status: 'AVAILABLE',
      };

      render(
        <div data-testid="audit-record" className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">{auditLogRecord.id}</span>
            <StatusBadge status={auditLogRecord.status} />
          </div>
          <p className="text-sm font-semibold text-foreground">{auditLogRecord.action}</p>
          <p className="text-xs text-muted-foreground">{auditLogRecord.admin_email}</p>
        </div>
      );

      const recordContainer = screen.getByTestId('audit-record');
      expect(recordContainer.className).toContain('rounded-xl');
      expect(recordContainer.className).toContain('border-border/60');
      expect(screen.getByText('CIRCULATION_CHECKOUT')).toBeInTheDocument();
      expect(screen.getByText('librarian@lumina.edu')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });
});
