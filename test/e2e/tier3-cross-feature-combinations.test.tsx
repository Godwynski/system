import { describe, it, expect } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { 
  hasPermission, 
  isStaff, 
  isAccessBlocked, 
  ROLE_RANKS, 
  type NavItem, 
  type Profile 
} from '@/lib/auth/permissions';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LuminaTable, type LuminaColumn } from '@/components/common/LuminaTable';
import { BookOpen } from 'lucide-react';

/**
 * Tier 3: Cross-Feature Combinations
 * - Role-based navigation and visibility matrices
 * - Modal/dialog interactive lifecycle (open, portal render, close transition)
 * - Empty state vs populated list rendering transitions
 * - Responsive navigation breakpoints
 */
describe('Tier 3: Cross-Feature Combinations Verification', () => {

  describe('3.1 Role-Based Visibility & Authorization Matrix', () => {
    const studentCatalogNav: NavItem = {
      href: '/catalog',
      label: 'Catalog',
      minRole: 'student',
    };

    const circulationDeskNav: NavItem = {
      href: '/circulation',
      label: 'Circulation Desk',
      minRole: 'student_assistant',
      permissionKey: 'manage_circulation',
    };

    const adminUsersNav: NavItem = {
      href: '/users',
      label: 'User Management',
      minRole: 'librarian',
      exactRoles: ['librarian', 'super_admin'],
    };

    const systemPoliciesNav: NavItem = {
      href: '/policies',
      label: 'Policy Engine',
      minRole: 'super_admin',
    };

    it('validates hierarchy of role ranks', () => {
      expect(ROLE_RANKS.student).toBeLessThan(ROLE_RANKS.student_assistant);
      expect(ROLE_RANKS.student_assistant).toBeLessThan(ROLE_RANKS.librarian);
      expect(ROLE_RANKS.librarian).toBeLessThan(ROLE_RANKS.super_admin);
    });

    it('grants basic catalog access to all authenticated roles', () => {
      const activeProfile: Profile = { status: 'ACTIVE' };
      expect(hasPermission('student', studentCatalogNav, activeProfile)).toBe(true);
      expect(hasPermission('student_assistant', studentCatalogNav, activeProfile)).toBe(true);
      expect(hasPermission('librarian', studentCatalogNav, activeProfile)).toBe(true);
      expect(hasPermission('super_admin', studentCatalogNav, activeProfile)).toBe(true);
      expect(hasPermission(null, studentCatalogNav, activeProfile)).toBe(false);
    });

    it('enforces circulation desk permissions based on role and active status', () => {
      const activeStaffProfile: Profile = { 
        status: 'ACTIVE', 
        permissions: { manage_circulation: true } 
      };
      const inactiveStaffProfile: Profile = { 
        status: 'INACTIVE', 
        permissions: { manage_circulation: true } 
      };
      const unprivilegedProfile: Profile = { 
        status: 'ACTIVE', 
        permissions: { manage_circulation: false } 
      };

      // Super admin & librarian always have circulation access
      expect(hasPermission('super_admin', circulationDeskNav, activeStaffProfile)).toBe(true);
      expect(hasPermission('librarian', circulationDeskNav, activeStaffProfile)).toBe(true);

      // Student assistant has access ONLY if active AND granted manage_circulation
      expect(hasPermission('student_assistant', circulationDeskNav, activeStaffProfile)).toBe(true);
      expect(hasPermission('student_assistant', circulationDeskNav, unprivilegedProfile)).toBe(false);
      expect(hasPermission('student_assistant', circulationDeskNav, inactiveStaffProfile)).toBe(false);

      // Student never has circulation staff access
      expect(hasPermission('student', circulationDeskNav, activeStaffProfile)).toBe(false);
    });

    it('restricts user management and policy engine strictly to privileged admin roles', () => {
      const activeProfile: Profile = { status: 'ACTIVE' };

      expect(hasPermission('super_admin', adminUsersNav, activeProfile)).toBe(true);
      expect(hasPermission('librarian', adminUsersNav, activeProfile)).toBe(true);
      expect(hasPermission('student_assistant', adminUsersNav, activeProfile)).toBe(false);
      expect(hasPermission('student', adminUsersNav, activeProfile)).toBe(false);

      expect(hasPermission('super_admin', systemPoliciesNav, activeProfile)).toBe(true);
      expect(hasPermission('librarian', systemPoliciesNav, activeProfile)).toBe(false);
      expect(hasPermission('student_assistant', systemPoliciesNav, activeProfile)).toBe(false);
      expect(hasPermission('student', systemPoliciesNav, activeProfile)).toBe(false);
    });

    it('accurately identifies active staff accounts vs blocked accounts', () => {
      expect(isStaff('super_admin')).toBe(true);
      expect(isStaff('librarian')).toBe(true);
      expect(isStaff('student_assistant', { status: 'ACTIVE' })).toBe(true);
      expect(isStaff('student_assistant', { status: 'SUSPENDED' })).toBe(false);
      expect(isStaff('student')).toBe(false);
      expect(isStaff(null)).toBe(false);

      expect(isAccessBlocked({ status: 'ACTIVE' })).toBe(false);
      expect(isAccessBlocked({ status: 'PENDING' })).toBe(true);
      expect(isAccessBlocked({ status: 'SUSPENDED' })).toBe(true);
      expect(isAccessBlocked({ status: 'INACTIVE' })).toBe(true);
    });
  });

  describe('3.2 Modal and Dialog Lifecycle Transitions', () => {
    function ControlledDialogHarness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsOpen(true)}>Open Circulation Modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Loan Checkout</DialogTitle>
              <DialogDescription>
                Ensure patron barcode matches before proceeding with circulation issuance.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              </DialogClose>
              <Button onClick={() => setIsOpen(false)}>Confirm Loan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    it('manages modal open and close transition states cleanly in the DOM', () => {
      render(<ControlledDialogHarness />);

      // Initially closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Trigger open
      const triggerBtn = screen.getByRole('button', { name: 'Open Circulation Modal' });
      fireEvent.click(triggerBtn);

      // Now open in DOM portal
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Confirm Loan Checkout')).toBeInTheDocument();
      expect(dialog.className).toContain('rounded-xl');
      expect(dialog.className).toContain('border-border/60');

      // Trigger close
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);

      // Modal closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('3.3 Empty State vs Populated Data Table Transitions', () => {
    interface BookRecord {
      id: string;
      title: string;
      isbn: string;
      status: string;
    }

    const testColumns: LuminaColumn<BookRecord>[] = [
      { header: 'Title', accessor: 'title' },
      { header: 'ISBN', accessor: 'isbn' },
      { header: 'Status', accessor: 'status' },
    ];

    it('toggles seamlessly between populated records and EmptyState display', () => {
      const sampleBooks: BookRecord[] = [
        { id: 'b1', title: 'Introduction to Algorithms', isbn: '978-0262033848', status: 'AVAILABLE' },
        { id: 'b2', title: 'Clean Architecture', isbn: '978-0134494166', status: 'BORROWED' },
      ];

      const { rerender } = render(
        <LuminaTable
          data={sampleBooks}
          columns={testColumns}
          emptyState={{
            icon: BookOpen,
            title: "No Books Found",
            description: "No items match current filter criteria.",
          }}
        />
      );

      // Populated view: rows exist across both responsive views
      expect(screen.getAllByText('Introduction to Algorithms').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Clean Architecture').length).toBeGreaterThan(0);
      expect(screen.queryByText('No Books Found')).not.toBeInTheDocument();

      // Transition to empty list (e.g. after filter narrowed down)
      rerender(
        <LuminaTable
          data={[]}
          columns={testColumns}
          emptyState={{
            icon: BookOpen,
            title: "No Books Found",
            description: "No items match current filter criteria.",
          }}
        />
      );

      // Empty state view: no rows, empty state active
      expect(screen.queryByText('Introduction to Algorithms')).not.toBeInTheDocument();
      expect(screen.getAllByText('No Books Found').length).toBeGreaterThan(0);
      expect(screen.getAllByText('No items match current filter criteria.').length).toBeGreaterThan(0);
    });

    it('renders structured loading state when isLoading is true without stale data flicker', () => {
      render(
        <LuminaTable
          data={[]}
          columns={testColumns}
          isLoading={true}
        />
      );

      // Loading spinner/message appears
      expect(screen.getByText(/Refreshing\.\.\./i)).toBeInTheDocument();
      expect(screen.queryByText('No Books Found')).not.toBeInTheDocument();
    });
  });

  describe('3.4 Responsive Layout Breakpoint Contracts', () => {
    it('LuminaTable provides dual responsive presentation for mobile and desktop', () => {
      const records: { id: string; title: string }[] = [{ id: '1', title: 'Mobile & Desktop Book' }];
      const cols: LuminaColumn<{ id: string; title: string }>[] = [
        { header: 'Title', accessor: 'title' },
      ];

      const { container } = render(
        <LuminaTable
          data={records}
          columns={cols}
        />
      );

      // Desktop table container carries hidden md:table
      const desktopTable = container.querySelector('table');
      expect(desktopTable).toHaveClass('hidden');
      expect(desktopTable).toHaveClass('md:table');

      // Mobile list container carries md:hidden
      const mobileContainer = container.querySelector('div.md\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});
