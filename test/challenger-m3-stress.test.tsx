import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Subsystem Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockResolveScan = vi.fn();
const mockCheckoutBook = vi.fn();
const mockReturnBook = vi.fn();

vi.mock('@/lib/actions/circulation', () => ({
  resolveScan: (...args: unknown[]) => mockResolveScan(...args),
  checkoutBook: (...args: unknown[]) => mockCheckoutBook(...args),
  returnBook: (...args: unknown[]) => mockReturnBook(...args),
}));

const mockStartScanner = vi.fn();
const mockStopCamera = vi.fn();

vi.mock('@/hooks/use-scanner', () => ({
  useScanner: () => ({
    cameraOpen: false,
    startScanner: mockStartScanner,
    stopCamera: mockStopCamera,
    isInitializing: false,
    cameraSupported: true,
    cameraIssue: null,
    scannerId: 'test-circulation-scanner',
    switchCamera: vi.fn(),
    hasMultipleCameras: false,
  }),
}));

const mockGetBookPublicDetails = vi.fn();
const mockGetBookAdminDetails = vi.fn();
const mockGetBooksForExport = vi.fn();
const mockBatchImportBooks = vi.fn();

vi.mock('@/lib/actions/catalog', () => ({
  getBookPublicDetails: (...args: unknown[]) => mockGetBookPublicDetails(...args),
  getBookAdminDetails: (...args: unknown[]) => mockGetBookAdminDetails(...args),
  getBooksForExport: (...args: unknown[]) => mockGetBooksForExport(...args),
  batchImportBooks: (...args: unknown[]) => mockBatchImportBooks(...args),
  updateBookCopyStatus: vi.fn().mockResolvedValue({ success: true }),
  updateBook: vi.fn().mockResolvedValue({ success: true }),
  softDeleteBook: vi.fn().mockResolvedValue({ success: true }),
  restoreBook: vi.fn().mockResolvedValue({ success: true }),
  addBookCopies: vi.fn().mockResolvedValue({ success: true }),
  getCategories: vi.fn().mockResolvedValue([]),
  lookupAndImportISBN: vi.fn().mockResolvedValue({ success: true }),
}));

const mockCancelReservation = vi.fn();
const mockGetBookAvailabilityStatus = vi.fn();

vi.mock('@/lib/actions/reservations', () => ({
  cancelReservation: (...args: unknown[]) => mockCancelReservation(...args),
  getBookAvailabilityStatus: (...args: unknown[]) => mockGetBookAvailabilityStatus(...args),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};
const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn().mockResolvedValue(true),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const mockStartISBNLookup = vi.fn();
vi.mock('@/components/providers/BatchTaskProvider', () => ({
  useBatchTask: () => ({
    isISBNProcessing: false,
    isbnProgress: { current: 0, total: 0, currentIsbn: '' },
    isbnLogs: [],
    startISBNLookup: mockStartISBNLookup,
    clearTask: vi.fn(),
  }),
  BatchTaskProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Milestone 3 Components Under Test
// ─────────────────────────────────────────────────────────────────────────────

import { CirculationStepper } from '@/components/circulation/CirculationStepper';
import { ScanStep } from '@/components/circulation/steps/ScanStep';
import { ReviewStep } from '@/components/circulation/steps/ReviewStep';
import { SuccessStep } from '@/components/circulation/steps/SuccessStep';
import { CirculationWizard } from '@/components/circulation/CirculationWizard';
import { BookDetailModal } from '@/components/catalog/BookDetailModal';
import { StudentBookDetailClient } from '@/app/(authenticated)/student-catalog/[id]/StudentBookDetailClient';
import { ModernInventoryClient } from '@/components/inventory/ModernInventoryClient';
import { InventoryGrid } from '@/components/inventory/InventoryGrid';
import { ISBNLookupBar } from '@/components/catalog/add/ISBNLookupBar';
import { AdminManagementContent } from '@/components/catalog/AdminManagementContent';
import type { Book, Category, BookCopyWithReservation } from '@/lib/types';

describe('Challenger Milestone 3 Adversarial Stress Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  // ===========================================================================
  // 1. CirculationStepper & ScanStep Adversarial Probing
  // ===========================================================================
  describe('CirculationStepper & ScanStep Boundaries', () => {
    const checkoutSteps = [
      { id: 1, label: 'Student Identification' },
      { id: 2, label: 'Resource Verification' },
      { id: 3, label: 'Final Review' },
    ];

    it('renders all stepper steps, marks completed steps with checkmark and active with ring', () => {
      const { container } = render(
        <CirculationStepper steps={checkoutSteps} currentStep={2} />
      );

      expect(screen.getByText('Student Identification')).toBeInTheDocument();
      expect(screen.getByText('Resource Verification')).toBeInTheDocument();
      expect(screen.getByText('Final Review')).toBeInTheDocument();

      // Step 1 is done (> 1) -> contains primary bg/text
      // Step 2 is active (=== 2) -> contains ring-4 ring-primary/10
      const activeStep = container.querySelector('.ring-4.ring-primary\\/10');
      expect(activeStep).toBeInTheDocument();
      expect(activeStep?.parentElement?.textContent).toContain('Resource Verification');
    });

    it('survives boundary step numbers (0, negative, > total)', () => {
      const { rerender, container } = render(
        <CirculationStepper steps={checkoutSteps} currentStep={0} />
      );
      // All steps upcoming, none done or active
      expect(container.querySelectorAll('.ring-4').length).toBe(0);

      rerender(<CirculationStepper steps={checkoutSteps} currentStep={999} />);
      // All steps done
      expect(screen.getByText('Final Review')).toBeInTheDocument();
    });

    it('ScanStep forces uppercase manual input and ignores empty or whitespace-only submissions', async () => {
      const onScanSpy = vi.fn().mockResolvedValue(true);
      render(
        <ScanStep
          title="Identify Student"
          description="Scan card"
          placeholder="Enter Card ID"
          onScan={onScanSpy}
          isProcessing={false}
          actionLabel="Process"
        />
      );

      const input = screen.getByPlaceholderText('Enter Card ID') as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: 'Process' });

      // Button is disabled when empty
      expect(submitBtn).toBeDisabled();

      // Typing lowercase transforms to uppercase
      fireEvent.change(input, { target: { value: 'stu-abc-123' } });
      expect(input.value).toBe('STU-ABC-123');
      expect(submitBtn).not.toBeDisabled();

      // Submitting calls onScan with uppercased value and isManual = true
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(onScanSpy).toHaveBeenCalledWith('STU-ABC-123', true);
      });
    });

    it('ScanStep handles keyboard Enter submission and suppresses when isProcessing is true', async () => {
      const onScanSpy = vi.fn().mockResolvedValue(true);
      const { rerender } = render(
        <ScanStep
          title="Identify Resource"
          description="Scan QR"
          placeholder="Enter QR"
          onScan={onScanSpy}
          isProcessing={false}
          actionLabel="Verify"
        />
      );

      const input = screen.getByPlaceholderText('Enter QR');
      fireEvent.change(input, { target: { value: 'BOOK-QR-001' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(onScanSpy).toHaveBeenCalledWith('BOOK-QR-001', true);
      });

      // When isProcessing is true, button is disabled and says "..."
      rerender(
        <ScanStep
          title="Identify Resource"
          description="Scan QR"
          placeholder="Enter QR"
          onScan={onScanSpy}
          isProcessing={true}
          actionLabel="Verify"
        />
      );

      expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
    });

    it('SuccessStep renders confirmation, hold fulfillment banner and invokes onReset', () => {
      const onResetSpy = vi.fn();
      render(
        <SuccessStep
          title="Return Complete"
          message="Resource returned."
          onReset={onResetSpy}
          reservationReady={true}
          reservedFor="Grace Hopper"
        />
      );

      expect(screen.getByText('Return Complete')).toBeInTheDocument();
      expect(screen.getByText('Resource returned.')).toBeInTheDocument();
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Process Another' }));
      expect(onResetSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // 2. CirculationWizard Step Transitions & Edge Cases
  // ===========================================================================
  describe('CirculationWizard Checkout & Return State Transitions', () => {
    it('executes full Checkout wizard: Student -> Book -> Review -> Confirm -> Success -> Reset', async () => {
      // Step 1: Scan student card
      mockResolveScan.mockResolvedValueOnce({
        success: true,
        data: {
          type: 'student',
          data: {
            cardNumber: 'CARD-9901',
            fullName: 'Alexander Wright',
            studentId: 'STU-2026-9901',
            status: 'Active',
          },
        },
      });

      // Step 2: Scan book copy
      mockCheckoutBook.mockResolvedValueOnce({
        success: true,
        data: {
          book_title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
          due_date: '2026-10-25',
        },
      });

      // Step 3: Confirm final checkout
      mockCheckoutBook.mockResolvedValueOnce({
        success: true,
        data: {},
      });

      render(<CirculationWizard />);

      // Starts at Step 1
      expect(screen.getByText('Identify Student')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Enter Card ID');

      fireEvent.change(input, { target: { value: 'CARD-9901' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      // Moves to Step 2: MemberPreview rendered and prompt asks for Book QR
      await waitFor(() => {
        expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
        expect(screen.getByText('STU-2026-9901')).toBeInTheDocument();
        expect(screen.getByText('Scan Resource')).toBeInTheDocument();
      });

      // Scan book
      const bookInput = screen.getByPlaceholderText('Enter Book QR');
      fireEvent.change(bookInput, { target: { value: 'COPY-DP-01' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

      // Moves to Step 3: Review Checkout
      await waitFor(() => {
        expect(screen.getByText('Review Checkout')).toBeInTheDocument();
        expect(screen.getByText('Design Patterns: Elements of Reusable Object-Oriented Software')).toBeInTheDocument();
        expect(screen.getByText('2026-10-25')).toBeInTheDocument();
      });

      // Confirm checkout
      const confirmBtn = screen.getByRole('button', { name: 'Confirm Checkout' });
      fireEvent.click(confirmBtn);

      // Moves to Step 4: SuccessStep
      await waitFor(() => {
        expect(screen.getByText('Checkout Complete')).toBeInTheDocument();
        expect(screen.getByText(/The resource has been successfully assigned to Alexander Wright/)).toBeInTheDocument();
      });

      // Clicking reset returns to initial Step 1
      const resetBtn = screen.getByRole('button', { name: 'Process Another' });
      fireEvent.click(resetBtn);

      await waitFor(() => {
        expect(screen.getByText('Identify Student')).toBeInTheDocument();
      });
    });

    it('rejects invalid student scan without transitioning to book step', async () => {
      mockResolveScan.mockResolvedValueOnce({
        success: false,
        error: 'Student card expired or suspended.',
      });

      render(<CirculationWizard />);

      const input = screen.getByPlaceholderText('Enter Card ID');
      fireEvent.change(input, { target: { value: 'CARD-SUSPENDED' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Student card expired or suspended.');
      });

      // Remains on Step 1
      expect(screen.getByText('Identify Student')).toBeInTheDocument();
      expect(screen.queryByText('Alexander Wright')).toBeNull();
    });

    it('handles unexpected non-student scan payload during Step 1', async () => {
      mockResolveScan.mockResolvedValueOnce({
        success: true,
        data: {
          type: 'book', // accidental book scanned instead of student
          data: { title: 'Some Book' },
        },
      });

      render(<CirculationWizard />);

      const input = screen.getByPlaceholderText('Enter Card ID');
      fireEvent.change(input, { target: { value: 'BOOK-MISSCAN' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Invalid student card.');
      });

      expect(screen.getByText('Identify Student')).toBeInTheDocument();
    });

    it('cancels review step and returns cleanly to Step 1 without recording transaction', async () => {
      mockResolveScan.mockResolvedValueOnce({
        success: true,
        data: {
          type: 'student',
          data: { cardNumber: 'C-1', fullName: 'Bob', studentId: 'S-1', status: 'Active' },
        },
      });
      mockCheckoutBook.mockResolvedValueOnce({
        success: true,
        data: { book_title: 'Clean Code', due_date: '2026-11-01' },
      });

      render(<CirculationWizard />);

      // Step 1
      fireEvent.change(screen.getByPlaceholderText('Enter Card ID'), { target: { value: 'C-1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      // Step 2
      await waitFor(() => expect(screen.getByText('Scan Resource')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Enter Book QR'), { target: { value: 'BK-1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

      // Step 3
      await waitFor(() => expect(screen.getByText('Review Checkout')).toBeInTheDocument());
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);

      // Back to Step 1
      await waitFor(() => {
        expect(screen.getByText('Identify Student')).toBeInTheDocument();
      });
      // Confirm checkout was never called with previewOnly: false
      expect(mockCheckoutBook).toHaveBeenCalledTimes(1); // Only the preview call
    });

    it('executes Return wizard flow with reservation alert on completion', async () => {
      // Mock return validation
      mockReturnBook.mockResolvedValueOnce({
        success: true,
        data: {
          book_title: 'Introduction to Algorithms',
          student_name: 'Clara Oswald',
          due_date: '2026-10-10',
          borrowed_at: '2026-09-26',
        },
      });

      // Mock return confirmation with reservation waiting
      mockReturnBook.mockResolvedValueOnce({
        success: true,
        data: {
          reservation_ready: true,
          reserved_for: 'David Tennant',
        },
      });

      render(<CirculationWizard />);

      // Switch to Return mode
      const returnModeBtn = screen.getByRole('button', { name: 'Return' });
      fireEvent.click(returnModeBtn);

      expect(mockReplace).toHaveBeenCalledWith('?mode=return');
      expect(screen.getAllByText('Identify Resource').length).toBeGreaterThanOrEqual(1);

      // Scan book to return
      const input = screen.getByPlaceholderText('Enter Book QR');
      fireEvent.change(input, { target: { value: 'RETURN-ALGO-01' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      // Step 2: Review Return
      await waitFor(() => {
        expect(screen.getByText('Review Return')).toBeInTheDocument();
        expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
        expect(screen.getByText('Clara Oswald')).toBeInTheDocument();
      });

      // Confirm Return
      const confirmBtn = screen.getByRole('button', { name: 'Confirm Return' });
      fireEvent.click(confirmBtn);

      // Success Step with reservation notice
      await waitFor(() => {
        expect(screen.getByText('Return Complete')).toBeInTheDocument();
        expect(screen.getByText('David Tennant')).toBeInTheDocument();
        expect(screen.getByText('Hold Fulfillment')).toBeInTheDocument();
      });
    });

    it('survives special characters and SQL injection attempts in barcode inputs', async () => {
      const maliciousScan = "'; DROP TABLE books; <script>alert('xss')</script>";
      mockResolveScan.mockResolvedValueOnce({
        success: false,
        error: 'Scan format unrecognized',
      });

      render(<CirculationWizard />);

      const input = screen.getByPlaceholderText('Enter Card ID');
      fireEvent.change(input, { target: { value: maliciousScan } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Scan format unrecognized');
      });
      expect(screen.queryByText(/alert\('xss'\)/)).toBeNull();
    });
  });

  // ===========================================================================
  // 3. ReviewStep Calculation, Overdue Fines & Extreme Dates
  // ===========================================================================
  describe('ReviewStep Data Boundaries & Extreme Dates', () => {
    it('renders checkout review with standard student and book details', () => {
      render(
        <ReviewStep
          type="checkout"
          studentName="Eleanor Vance"
          studentId="STU-2026-4401"
          bookTitle="Haunting of Hill House"
          dueDate="2026-10-31"
        />
      );

      expect(screen.getByText('Review Checkout')).toBeInTheDocument();
      expect(screen.getByText('Eleanor Vance')).toBeInTheDocument();
      expect(screen.getByText('STU-2026-4401')).toBeInTheDocument();
      expect(screen.getByText('Haunting of Hill House')).toBeInTheDocument();
      expect(screen.getByText('2026-10-31')).toBeInTheDocument();
      expect(screen.queryByText('BORROWED')).toBeNull();
    });

    it('renders return review with borrowed date and due date', () => {
      render(
        <ReviewStep
          type="return"
          studentName="Arthur Dent"
          studentId="N/A"
          bookTitle="Hitchhiker's Guide to the Galaxy"
          dueDate="2026-10-01"
          borrowedAt="2026-09-17"
        />
      );

      expect(screen.getByText('Review Return')).toBeInTheDocument();
      expect(screen.getByText('Arthur Dent')).toBeInTheDocument();
      expect(screen.getByText('BORROWED')).toBeInTheDocument();
      expect(screen.getByText('2026-09-17')).toBeInTheDocument();
      expect(screen.getByText('2026-10-01')).toBeInTheDocument();
    });

    it('handles extreme dates (leap year, far future, epoch, ISO timestamp)', () => {
      const dates = [
        '2028-02-29',
        '2099-12-31',
        '1970-01-01',
        '2026-10-11T15:30:00.000Z',
      ];

      for (const d of dates) {
        const { unmount } = render(
          <ReviewStep
            type="checkout"
            studentName="Time Traveler"
            studentId="TT-01"
            bookTitle="The Time Machine"
            dueDate={d}
          />
        );
        expect(screen.getByText(d)).toBeInTheDocument();
        unmount();
      }
    });

    it('handles empty strings and huge strings (1000 characters) without crashing', () => {
      const hugeTitle = 'T'.repeat(1000);
      const hugeName = 'N'.repeat(1000);

      const { container } = render(
        <ReviewStep
          type="checkout"
          studentName={hugeName}
          studentId=""
          bookTitle={hugeTitle}
          dueDate=""
        />
      );

      expect(container.textContent).toContain(hugeTitle);
      expect(container.textContent).toContain(hugeName);
    });
  });

  // ===========================================================================
  // 4. BookDetailModal Rendering with Missing Attributes & Copy Limits
  // ===========================================================================
  describe('BookDetailModal Resilience & Boundary Probing', () => {
    it('handles missing author, null ISBN, null Dewey decimal, and null categories gracefully', async () => {
      const incompleteBook = {
        id: 'book-incomplete-1',
        title: 'Minimalist Book Record',
        author: '',
        isbn: null,
        cover_url: null,
        section: null,
        location: null,
        available_copies: 0,
        total_copies: 0,
        categories: null,
        tags: null,
        dewey_decimal: null,
      };

      mockGetBookPublicDetails.mockResolvedValueOnce({
        book: incompleteBook,
        availability: {
          nextAvailableDate: null,
          hasReservation: false,
          isReady: false,
          queuePosition: null,
          holdExpiresAt: null,
          reservationId: null,
        },
      });

      render(
        <BookDetailModal
          bookId="book-incomplete-1"
          open={true}
          onOpenChange={vi.fn()}
          variant="student"
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Minimalist Book Record').length).toBeGreaterThanOrEqual(1);
      });

      // Checks fallbacks
      expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2); // ISBN & DDC
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('0/0 free')).toBeInTheDocument(); // CopyMeter 0/0 doesn't NaN crash
      expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
    });

    it('handles array of categories and tag overflow badges (+N)', async () => {
      const richBook = {
        id: 'book-rich-1',
        title: 'Complete Software Architecture',
        author: 'Martin Fowler',
        isbn: '978-0132350884',
        cover_url: 'https://example.com/cover.jpg',
        section: 'Stack 4',
        location: 'Level 2',
        available_copies: 3,
        total_copies: 5,
        categories: [{ name: 'Engineering' }, { name: 'Architecture' }],
        tags: ['Pattern', 'Design', 'Microservices', 'Distributed', 'Cloud'],
        dewey_decimal: '005.1',
      };

      mockGetBookPublicDetails.mockResolvedValueOnce({
        book: richBook,
        availability: {
          nextAvailableDate: null,
          hasReservation: false,
          isReady: false,
          queuePosition: null,
          holdExpiresAt: null,
          reservationId: null,
        },
      });

      render(
        <BookDetailModal
          bookId="book-rich-1"
          open={true}
          onOpenChange={vi.fn()}
          variant="student"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Complete Software Architecture')).toBeInTheDocument();
      });

      // Tags display first 3, then +2
      expect(screen.getByText('Pattern')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Microservices')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();

      // CopyMeter displays 3/5 free
      expect(screen.getByText('3/5 free')).toBeInTheDocument();
      expect(screen.getByText('3 on shelf')).toBeInTheDocument();
      expect(screen.getByText('2 borrowed')).toBeInTheDocument();
    });

    it('displays pickup deadline when availability.isReady is true', async () => {
      const heldBook = {
        id: 'book-held-1',
        title: 'Structure and Interpretation of Computer Programs',
        author: 'Harold Abelson',
        isbn: '978-0262510875',
        cover_url: null,
        section: 'Stack 1',
        location: 'Main',
        available_copies: 0,
        total_copies: 2,
        categories: { name: 'Computer Science' },
        tags: ['Scheme', 'Lisp'],
        dewey_decimal: '005.13',
      };

      mockGetBookPublicDetails.mockResolvedValueOnce({
        book: heldBook,
        availability: {
          nextAvailableDate: null,
          hasReservation: true,
          isReady: true,
          queuePosition: 1,
          holdExpiresAt: '2026-10-20T17:00:00.000Z',
          reservationId: 'res-held-101',
        },
      });

      render(
        <BookDetailModal
          bookId="book-held-1"
          open={true}
          onOpenChange={vi.fn()}
          variant="student"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Ready for Pickup')).toBeInTheDocument();
        expect(screen.getByText(/Claim by/i)).toBeInTheDocument();
        expect(screen.getByText('✦ Ready')).toBeInTheDocument();
      });
    });

    it('renders and operates reservation cancel modal in student view', async () => {
      const reservedBook = {
        id: 'book-res-1',
        title: 'Database Internals',
        author: 'Alex Petrov',
        isbn: '978-1492040347',
        cover_url: null,
        section: 'Stack 2',
        location: 'Main',
        available_copies: 0,
        total_copies: 1,
        categories: null,
        tags: [],
        dewey_decimal: '005.74',
      };

      mockGetBookPublicDetails.mockResolvedValueOnce({
        book: reservedBook,
        availability: {
          nextAvailableDate: '2026-10-30',
          hasReservation: true,
          isReady: false,
          queuePosition: 2,
          holdExpiresAt: null,
          reservationId: 'res-cancel-test-1',
        },
      });

      const onCancelSuccessSpy = vi.fn();
      mockCancelReservation.mockResolvedValueOnce({ success: true });

      render(
        <BookDetailModal
          bookId="book-res-1"
          open={true}
          onOpenChange={vi.fn()}
          variant="student"
          onCancelSuccess={onCancelSuccessSpy}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Position #2')).toBeInTheDocument();
      });

      // Click "Cancel" button next to Reserve button
      const cancelTrigger = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelTrigger);

      // Cancel confirmation dialog opens
      await waitFor(() => {
        expect(screen.getByText('Cancel Reservation?')).toBeInTheDocument();
        expect(screen.getByText(/You'll lose your queue position for/i)).toBeInTheDocument();
      });

      // Confirm cancel
      const yesCancelBtn = screen.getByRole('button', { name: 'Yes, Cancel' });
      fireEvent.click(yesCancelBtn);

      await waitFor(() => {
        expect(mockCancelReservation).toHaveBeenCalledWith('res-cancel-test-1');
        expect(mockToastSuccess).toHaveBeenCalledWith('Reservation cancelled');
        expect(onCancelSuccessSpy).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 5. StudentBookDetailClient Dedicated Page Testing
  // ===========================================================================
  describe('StudentBookDetailClient Robustness & States', () => {
    function createResolvedPromise<T>(val: T): Promise<T> {
      const p = Promise.resolve(val) as Promise<T> & { status: string; value: T };
      p.status = 'fulfilled';
      p.value = val;
      return p;
    }

    it('renders 404 empty state when book is null', async () => {
      const bookPromise = createResolvedPromise(null);
      const availabilityPromise = createResolvedPromise({
        nextAvailableDate: null,
        hasReservation: false,
        isReady: false,
        queuePosition: null,
        holdExpiresAt: null,
        reservationId: null,
      });

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <StudentBookDetailClient
            bookPromise={bookPromise}
            availabilityPromise={availabilityPromise}
            id="non-existent-id"
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Book not found')).toBeInTheDocument();
        expect(screen.getByText('Back to Catalog')).toBeInTheDocument();
      });
    });

    it('renders unavailable book with return date estimate banner', async () => {
      const book = {
        id: 'book-unavail-1',
        title: 'Operating Systems: Three Easy Pieces',
        author: 'Remzi Arpaci-Dusseau',
        isbn: '978-1985086593',
        cover_url: null,
        section: 'Stack 5',
        location: 'Annex',
        available_copies: 0,
        total_copies: 4,
        categories: { name: 'Systems' },
        tags: ['OS', 'Concurrency', 'Virtualization'],
      };

      const bookPromise = createResolvedPromise(book);
      const availabilityPromise = createResolvedPromise({
        nextAvailableDate: '2026-11-15T00:00:00.000Z',
        hasReservation: false,
        isReady: false,
        queuePosition: null,
        holdExpiresAt: null,
        reservationId: null,
      });

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <StudentBookDetailClient
            bookPromise={bookPromise}
            availabilityPromise={availabilityPromise}
            id="book-unavail-1"
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Operating Systems: Three Easy Pieces').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/Estimated availability/i)).toBeInTheDocument();
        expect(screen.getByText('Nov 15')).toBeInTheDocument();
      });
    });

    it('renders cancel reservation dialog and keeps reservation when dismissed', async () => {
      const book = {
        id: 'book-held-2',
        title: 'Compilers: Principles, Techniques, and Tools',
        author: 'Alfred Aho',
        isbn: '978-0321486813',
        cover_url: null,
        section: 'Stack 2',
        location: 'Annex',
        available_copies: 0,
        total_copies: 1,
        categories: { name: 'Compilers' },
        tags: [],
      };

      const bookPromise = createResolvedPromise(book);
      const availabilityPromise = createResolvedPromise({
        nextAvailableDate: null,
        hasReservation: true,
        isReady: false,
        queuePosition: 1,
        holdExpiresAt: null,
        reservationId: 'res-cancel-keep-1',
      });

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <StudentBookDetailClient
            bookPromise={bookPromise}
            availabilityPromise={availabilityPromise}
            id="book-held-2"
          />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Reservation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel Reservation' }));

      await waitFor(() => {
        expect(screen.getByText('Keep Reservation')).toBeInTheDocument();
      });

      // Click Keep Reservation
      fireEvent.click(screen.getByRole('button', { name: 'Keep Reservation' }));

      // Ensure cancelReservation was not invoked
      expect(mockCancelReservation).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 6. ModernInventoryClient Search, Filters & Empty Sets
  // ===========================================================================
  describe('ModernInventoryClient Search, Filters & Batch Operations', () => {
    const sampleCategories: Category[] = [
      { id: 'cat-1', name: 'Computer Science', description: 'Tech books', created_at: '2026-01-01' },
      { id: 'cat-2', name: 'Mathematics', description: 'Math books', created_at: '2026-01-01' },
    ];

    const sampleBooks: Book[] = [
      {
        id: 'b-1',
        title: 'The Pragmatic Programmer',
        author: 'Andy Hunt',
        isbn: '978-0135957059',
        cover_url: undefined,
        category_id: 'cat-1',
        is_active: true,
        created_at: '2026-01-01',
        available_copies: 2,
        total_copies: 3,
        categories: { name: 'Computer Science' },
      },
    ];

    it('renders empty vault state with action link when books array is empty', () => {
      render(
        <ModernInventoryClient
          books={[]}
          totalItems={0}
          categories={sampleCategories}
          canManage={true}
        />
      );

      expect(screen.getByText('Vault is Empty')).toBeInTheDocument();
      expect(screen.getByText(/No physical assets were found matching your criteria/)).toBeInTheDocument();
      const initBtn = screen.getByRole('link', { name: /Initialize First Entry/i });
      expect(initBtn).toHaveAttribute('href', '/inventory/add');
    });

    it('suppresses action link when canManage is false on empty vault', () => {
      render(
        <ModernInventoryClient
          books={[]}
          totalItems={0}
          categories={sampleCategories}
          canManage={false}
        />
      );

      expect(screen.getByText('Vault is Empty')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Initialize First Entry/i })).toBeNull();
    });

    it('handles search input with special characters and clears via X button', () => {
      render(
        <ModernInventoryClient
          books={sampleBooks}
          totalItems={1}
          categories={sampleCategories}
          canManage={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search inventory...') as HTMLInputElement;

      // Type special characters
      const adversarialQuery = "Pragmatic & ' OR 1=1; <img src=x onerror=alert(1)>";
      fireEvent.change(searchInput, { target: { value: adversarialQuery } });
      expect(searchInput.value).toBe(adversarialQuery);

      // Submit search form
      fireEvent.submit(searchInput.closest('form')!);
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('q=Pragmatic'), expect.anything());

      // Clear search button appears
      const clearBtn = searchInput.parentElement?.querySelector('button');
      expect(clearBtn).not.toBeNull();
      fireEvent.click(clearBtn!);

      expect(searchInput.value).toBe('');
      expect(mockReplace).toHaveBeenCalled();
    });

    it('opens Batch Operations dialog and verifies tabs exist', async () => {
      render(
        <ModernInventoryClient
          books={sampleBooks}
          totalItems={1}
          categories={sampleCategories}
          canManage={true}
        />
      );

      const batchOpsBtn = screen.getByRole('button', { name: /Batch Ops/i });
      fireEvent.click(batchOpsBtn);

      await waitFor(() => {
        expect(screen.getByText('Batch Catalog Operations')).toBeInTheDocument();
        expect(screen.getByText('Import Sheet')).toBeInTheDocument();
        expect(screen.getByText('ISBN Fallback')).toBeInTheDocument();
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });

      // Switch to ISBN Fallback tab
      fireEvent.click(screen.getByText('ISBN Fallback'));
      expect(screen.getByPlaceholderText(/9780743273565/)).toBeInTheDocument();

      // Switch to Export Data tab
      fireEvent.click(screen.getByText('Export Data'));
      expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
      expect(screen.getByText('Text CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
    });

    it('InventoryGrid renders both student view and admin view cards correctly', () => {
      const { unmount } = render(
        <InventoryGrid
          books={sampleBooks}
          canManage={true}
          isStudentView={false}
        />
      );

      expect(screen.getAllByText('The Pragmatic Programmer').length).toBeGreaterThanOrEqual(1);
      unmount();

      render(
        <InventoryGrid
          books={sampleBooks}
          canManage={false}
          isStudentView={true}
        />
      );

      expect(screen.getAllByText('The Pragmatic Programmer').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // 7. Catalog Admin & ISBN Lookup Deep Invariant Probing
  // ===========================================================================
  describe('Catalog Admin, ISBN Sanitization & Circulation Idempotency', () => {
    it('ISBNLookupBar strips formatting hyphens and spaces keeping only digits', () => {
      const onIsbnChangeSpy = vi.fn();
      const onFetchDataSpy = vi.fn();

      render(
        <ISBNLookupBar
          isbn=""
          onIsbnChange={onIsbnChangeSpy}
          onFetchData={onFetchDataSpy}
          isbnLoading={false}
        />
      );

      const input = screen.getByPlaceholderText('Enter ISBN-10 or ISBN-13');
      const fetchBtn = screen.getByRole('button', { name: 'Fetch Data' });

      // Button is disabled when isbn is empty
      expect(fetchBtn).toBeDisabled();

      // Input with hyphens, spaces and alpha characters
      fireEvent.change(input, { target: { value: '978-0-13-235088-4 XYZ' } });

      // Verifies only digits are passed to onIsbnChange
      expect(onIsbnChangeSpy).toHaveBeenCalledWith('9780132350884');
    });

    it('ISBNLookupBar shows loading indicator and disables button during fetch', () => {
      const onFetchDataSpy = vi.fn();

      render(
        <ISBNLookupBar
          isbn="9780132350884"
          onIsbnChange={vi.fn()}
          onFetchData={onFetchDataSpy}
          isbnLoading={true}
        />
      );

      const fetchBtn = screen.getByRole('button', { name: 'Searching...' });
      expect(fetchBtn).toBeDisabled();
    });

    it('AdminManagementContent renders copies table, queue entries and stats bar', () => {
      const sampleAdminBook: Book = {
        id: 'admin-book-1',
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        isbn: '978-0201485677',
        cover_url: undefined,
        category_id: 'cat-tech-1',
        is_active: true,
        created_at: '2026-01-01',
        available_copies: 1,
        total_copies: 2,
        section: 'Stack A',
        location: 'Level 1',
        dewey_decimal: '005.1',
        categories: { name: 'Software Engineering' },
      };

      const sampleCopies: BookCopyWithReservation[] = [
        {
          id: 'copy-101',
          book_id: 'admin-book-1',
          qr_string: 'QR-001',
          accession_number: 'ACC-001',
          status: 'AVAILABLE',
          condition: 'GOOD',
          reservation: null,
          created_at: '2026-01-01',
        },
        {
          id: 'copy-102',
          book_id: 'admin-book-1',
          qr_string: 'QR-002',
          accession_number: 'ACC-002',
          status: 'BORROWED',
          condition: 'GOOD',
          reservation: null,
          created_at: '2026-01-01',
        },
      ];

      render(
        <AdminManagementContent
          initialBook={sampleAdminBook}
          initialCopies={sampleCopies}
          initialQueue={[]}
          onClose={vi.fn()}
          onRefresh={vi.fn()}
          canManage={true}
        />
      );

      expect(screen.getAllByText('Refactoring: Improving the Design of Existing Code').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Martin Fowler')).toBeInTheDocument();
      expect(screen.getByText('QR-001')).toBeInTheDocument();
      expect(screen.getByText('ACC-001')).toBeInTheDocument();
      expect(screen.getByText('QR-002')).toBeInTheDocument();
      expect(screen.getByText('ACC-002')).toBeInTheDocument();
    });

    it('CirculationWizard maintains idempotency keys across successive scans and operations', async () => {
      mockResolveScan.mockResolvedValueOnce({
        success: true,
        data: {
          type: 'student',
          data: { cardNumber: 'IDEM-C1', fullName: 'Grace Hopper', studentId: 'GH-01', status: 'Active' },
        },
      });

      mockCheckoutBook.mockResolvedValueOnce({
        success: true,
        data: { book_title: 'Compilers in Depth', due_date: '2026-11-20' },
      });

      render(<CirculationWizard />);

      // Step 1: Scan student
      fireEvent.change(screen.getByPlaceholderText('Enter Card ID'), { target: { value: 'IDEM-C1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Process' }));

      // Step 2: Scan book
      await waitFor(() => expect(screen.getByText('Scan Resource')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Enter Book QR'), { target: { value: 'IDEM-BK-01' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

      // Step 3: Review step reached
      await waitFor(() => expect(screen.getByText('Review Checkout')).toBeInTheDocument());

      // Mock confirmation
      mockCheckoutBook.mockResolvedValueOnce({ success: true, data: {} });

      const confirmBtn = screen.getByRole('button', { name: 'Confirm Checkout' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockCheckoutBook).toHaveBeenCalledWith(
          expect.objectContaining({
            studentCardQr: 'IDEM-C1',
            bookQr: 'IDEM-BK-01',
            previewOnly: false,
            idempotencyKey: expect.any(String),
          })
        );
      });
    });
  });
});
