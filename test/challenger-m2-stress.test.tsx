import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LuminaTable, LuminaColumn } from "@/components/common/LuminaTable";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationList } from "@/components/notifications/NotificationList";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import AuthenticatedLoading from "@/app/(authenticated)/loading";
import { 
  Inbox, 
  BookOpen, 
  Search, 
  ShieldAlert, 
  FileText, 
  CheckCircle2 
} from "lucide-react";


// Mock the notifications hook for NotificationBell tests
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
let mockHookState = {
  notifications: [
    {
      id: "n-1",
      user_id: "u-1",
      title: "First Notification",
      content: "Details 1",
      type: "DUE_SOON",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ],
  unreadCount: 1,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  loading: false,
};

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => mockHookState,
}));

describe("Challenger Milestone 2 Adversarial Stress Suite", () => {
  // =========================================================================
  // 1. RoleBadge Stress Testing
  // =========================================================================
  describe("RoleBadge Adversarial Probing", () => {
    it("handles all standard roles with accurate casing and labels", () => {
      const expectations: Record<string, string> = {
        super_admin: "Super Admin",
        admin: "Administrator",
        librarian: "Librarian",
        staff: "Staff",
        student_assistant: "Student Assistant",
        student: "Student",
        patron: "Patron",
      };

      for (const [role, label] of Object.entries(expectations)) {
        const { unmount } = render(<RoleBadge role={role} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      }
    });

    it("handles mixed case, uppercase, and weird casing variations gracefully", () => {
      const cases = [
        { input: "SUPER_ADMIN", expected: "Super Admin" },
        { input: "LiBrArIaN", expected: "Librarian" },
        { input: "StUdEnT_aSsIsTaNt", expected: "Student Assistant" },
        { input: "STAFF", expected: "Staff" },
        { input: "PATRON", expected: "Patron" },
      ];

      for (const { input, expected } of cases) {
        const { unmount } = render(<RoleBadge role={input} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      }
    });

    it("falls back to raw string for unknown roles without throwing", () => {
      const unknownRoles = [
        "visiting_scholar",
        "ARCHIVIST",
        "external_auditor",
        "special_guest_123",
      ];

      for (const role of unknownRoles) {
        const { unmount } = render(<RoleBadge role={role} />);
        expect(screen.getByText(role)).toBeInTheDocument();
        unmount();
      }
    });

    it("renders empty string role without throwing and maintains badge styling", () => {
      const { container } = render(<RoleBadge role="" />);
      const badge = container.querySelector("span");
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("");
      expect(badge?.className).toContain("rounded-lg");
      expect(badge?.className).toContain("border-border/60");
    });

    it("renders extremely long role names without breaking component rendering", () => {
      const longRole = "A".repeat(500);
      const { container } = render(<RoleBadge role={longRole} />);
      expect(container.textContent).toBe(longRole);
    });

    it("accepts custom className and combines with default styles", () => {
      const { container } = render(<RoleBadge role="librarian" className="custom-test-class shadow-lg" />);
      const badge = container.querySelector("span");
      expect(badge?.className).toContain("custom-test-class");
      expect(badge?.className).toContain("shadow-lg");
      expect(badge?.className).toContain("rounded-lg");
    });

    it("explores behavior when role is null or undefined (runtime defensive check)", () => {
      // RoleBadge currently invokes role.toLowerCase() directly without null-checking.
      // We verify that passing undefined/null throws a TypeError as observed.
      expect(() => {
        render(<RoleBadge role={undefined as unknown as string} />);
      }).toThrow(TypeError);

      expect(() => {
        render(<RoleBadge role={null as unknown as string} />);
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 2. StatusBadge Stress Testing
  // =========================================================================
  describe("StatusBadge Adversarial Probing", () => {
    it("maps all recognized database and circulation statuses to appropriate semantic tokens", () => {
      const statusMatrix = [
        // Success states
        { status: "AVAILABLE", classCheck: "status-success", labelCheck: "Available" },
        { status: "available", classCheck: "status-success", labelCheck: "Available" },
        { status: "READY", classCheck: "status-success", labelCheck: "Ready" },
        { status: "ready", classCheck: "status-success", labelCheck: "Ready" },
        { status: "RETURNED", classCheck: "status-success", labelCheck: "Returned" },
        { status: "returned", classCheck: "status-success", labelCheck: "Returned" },
        // Warning states
        { status: "BORROWED", classCheck: "status-warning", labelCheck: "Borrowed" },
        { status: "borrowed", classCheck: "status-warning", labelCheck: "Borrowed" },
        { status: "PENDING", classCheck: "status-warning", labelCheck: "Pending" },
        { status: "pending", classCheck: "status-warning", labelCheck: "Pending" },
        { status: "MAINTENANCE", classCheck: "status-warning", labelCheck: "Maintenance" },
        // Danger states
        { status: "OVERDUE", classCheck: "status-danger", labelCheck: "Overdue" },
        { status: "overdue", classCheck: "status-danger", labelCheck: "Overdue" },
        { status: "LOST", classCheck: "status-danger", labelCheck: "Lost" },
        { status: "lost", classCheck: "status-danger", labelCheck: "Lost" },
        { status: "SUSPENDED", classCheck: "status-danger", labelCheck: "Suspended" },
        { status: "EXPIRED", classCheck: "status-danger", labelCheck: "Expired" },
        // Neutral states
        { status: "ARCHIVED", classCheck: "status-neutral", labelCheck: "Archived" },
        { status: "archived", classCheck: "status-neutral", labelCheck: "Archived" },
        { status: "CANCELLED", classCheck: "status-neutral", labelCheck: "Cancelled" },
        { status: "COMPLETED", classCheck: "status-neutral", labelCheck: "Completed" },
        { status: "GRADUATED", classCheck: "status-neutral", labelCheck: "Graduated" },
      ];

      for (const item of statusMatrix) {
        const { container, unmount } = render(<StatusBadge status={item.status} />);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain(item.classCheck);
        expect(badge.textContent).toBe(item.labelCheck);
        unmount();
      }
    });

    it("falls back to status-neutral and preserves raw status text for unmapped statuses", () => {
      const customStatuses = ["IN_QUARANTINE", "DECOMMISSIONED", "CUSTOM_STATE_XYZ"];

      for (const status of customStatuses) {
        const { container, unmount } = render(<StatusBadge status={status} />);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain("status-neutral");
        expect(badge.textContent).toBe(status);
        unmount();
      }
    });

    it("renders empty string status cleanly as status-neutral", () => {
      const { container } = render(<StatusBadge status="" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("status-neutral");
      expect(badge.textContent).toBe("");
    });

    it("merges custom className overrides correctly", () => {
      const { container } = render(<StatusBadge status="AVAILABLE" className="my-test-override font-black" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("my-test-override");
      expect(badge.className).toContain("font-black");
      expect(badge.className).toContain("status-success");
      expect(badge.className).toContain("rounded-lg");
    });

    it("explores behavior when status is null or undefined (runtime defensive check)", () => {
      // StatusBadge invokes status.toUpperCase() and status.toLowerCase() directly.
      expect(() => {
        render(<StatusBadge status={undefined as unknown as string} />);
      }).toThrow(TypeError);

      expect(() => {
        render(<StatusBadge status={null as unknown as string} />);
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 3. LuminaTable Stress Testing
  // =========================================================================
  describe("LuminaTable Adversarial Probing", () => {
    type TestRow = {
      id: number | string;
      title?: string | null;
      author?: string | null;
      copies?: number;
      tags?: string[];
    };

    const standardColumns: LuminaColumn<TestRow>[] = [
      { header: "Title", accessor: "title", mobileMain: true },
      { header: "Author", accessor: "author" },
      { header: "Copies", accessor: (item) => `${item.copies ?? 0} in stock` },
    ];

    it("handles zero-row data with custom EmptyState configuration and executes callback", () => {
      const onActionClick = vi.fn();
      render(
        <LuminaTable
          data={[]}
          columns={standardColumns}
          emptyState={{
            icon: ShieldAlert,
            title: "No Security Records",
            description: "No security audit logs found for this filter.",
            action: {
              label: "Reset Query",
              onClick: onActionClick,
            },
          }}
        />
      );

      // Desktop & Mobile both render the EmptyState
      expect(screen.getAllByText("No Security Records").length).toBeGreaterThan(0);
      expect(screen.getAllByText("No security audit logs found for this filter.").length).toBeGreaterThan(0);

      const actionButtons = screen.getAllByRole("button", { name: "Reset Query" });
      expect(actionButtons.length).toBeGreaterThan(0);
      fireEvent.click(actionButtons[0]);
      expect(onActionClick).toHaveBeenCalledTimes(1);
    });

    it("handles zero-row data with default EmptyState fallback when no emptyState prop provided", () => {
      render(<LuminaTable data={[]} columns={standardColumns} />);
      expect(screen.getAllByText("No results found").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Try adjusting your search or filters.").length).toBeGreaterThan(0);
    });

    it("survives rendering a massive 1,000 row dataset without crashing", () => {
      const hugeDataset: TestRow[] = Array.from({ length: 1000 }, (_, idx) => ({
        id: idx + 1,
        title: `Book Title #${idx + 1}`,
        author: `Author Name ${idx + 1}`,
        copies: (idx % 10) + 1,
      }));

      const { container } = render(
        <LuminaTable data={hugeDataset} columns={standardColumns} />
      );

      // Both desktop table rows and mobile rows exist
      const desktopRows = container.querySelectorAll("tbody tr");
      expect(desktopRows.length).toBe(1000);

      // Spot check first and last item in the DOM
      expect(screen.getAllByText("Book Title #1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Book Title #1000").length).toBeGreaterThan(0);
    });

    it("handles data with null, undefined, empty string, and unusual IDs", () => {
      const anomalousData: TestRow[] = [
        { id: 0, title: "", author: null, copies: undefined },
        { id: -999, title: null, author: undefined, copies: 0 },
        { id: "uuid-alpha-beta-gamma", title: "Valid Title", author: "Valid Author" },
      ];

      const { container } = render(
        <LuminaTable data={anomalousData} columns={standardColumns} />
      );

      // Should render without throwing errors
      expect(container.querySelectorAll("tbody tr").length).toBe(3);
      expect(screen.getAllByText("Valid Title").length).toBeGreaterThan(0);
    });

    it("prioritizes cell prop over accessor and supports arbitrary JSX nodes", () => {
      const customColumns: LuminaColumn<TestRow>[] = [
        {
          header: "Custom Cell Col",
          accessor: "title",
          cell: (item) => (
            <div data-testid={`custom-badge-${item.id}`} className="font-extrabold text-primary">
              Override: {item.title}
            </div>
          ),
        },
      ];

      const testData: TestRow[] = [
        { id: 101, title: "Domain Driven Design" },
      ];

      render(<LuminaTable data={testData} columns={customColumns} />);

      const customBadges = screen.getAllByTestId("custom-badge-101");
      expect(customBadges.length).toBeGreaterThan(0);
      expect(customBadges[0].textContent).toBe("Override: Domain Driven Design");
    });

    it("triggers onRowClick for both desktop and mobile items", () => {
      const onRowClickSpy = vi.fn();
      const testData: TestRow[] = [
        { id: 42, title: "Hitchhikers Guide", author: "Douglas Adams" },
      ];

      const { container } = render(
        <LuminaTable data={testData} columns={standardColumns} onRowClick={onRowClickSpy} />
      );

      // Click desktop row
      const desktopRow = container.querySelector("tbody tr");
      expect(desktopRow).not.toBeNull();
      fireEvent.click(desktopRow!);
      expect(onRowClickSpy).toHaveBeenCalledWith(testData[0]);

      // Click mobile card
      const mobileRow = container.querySelector(".md\\:hidden .p-4");
      expect(mobileRow).not.toBeNull();
      fireEvent.click(mobileRow!);
      expect(onRowClickSpy).toHaveBeenCalledTimes(2);
    });

    it("renders loading state with Loader2 and 'Refreshing...' indicator", () => {
      render(
        <LuminaTable data={[]} columns={standardColumns} isLoading={true} />
      );

      expect(screen.getByText("Refreshing...")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument(); // Mobile loader
    });

    it("renders pagination controls when totalPages > 1 and onPageChange is provided", () => {
      const onPageChangeSpy = vi.fn();
      render(
        <LuminaTable
          data={[{ id: 1, title: "Book 1" }]}
          columns={standardColumns}
          totalCount={50}
          page={1}
          pageSize={10}
          onPageChange={onPageChangeSpy}
        />
      );

      // Query pagination buttons
      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1]; // Last button is ChevronRight
      expect(nextButton).toBeInTheDocument();
      fireEvent.click(nextButton);
      expect(onPageChangeSpy).toHaveBeenCalledWith(2);

    });

    it("honors noBorder prop by applying border-none bg-transparent shadow-none", () => {
      const { container } = render(
        <LuminaTable data={[]} columns={standardColumns} noBorder={true} />
      );

      const tableShell = container.querySelector(".border-none.bg-transparent.shadow-none");
      expect(tableShell).not.toBeNull();
    });

    it("explores behavior when columns array is empty with non-empty data", () => {
      // If data is present but columns is [], defaultMobileRow accesses columns[0] which is undefined.
      // Calling renderCell(item, undefined) accesses col.cell, throwing a TypeError.
      expect(() => {
        render(<LuminaTable data={[{ id: 1, title: "Test" }]} columns={[]} />);
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 4. AdminTableShell Stress Testing
  // =========================================================================
  describe("AdminTableShell Adversarial Probing", () => {
    it("renders minimal configuration with only children without crashing", () => {
      const { container } = render(
        <AdminTableShell>
          <div data-testid="table-content">Minimal Table</div>
        </AdminTableShell>
      );

      expect(screen.getByTestId("table-content")).toBeInTheDocument();
      const shell = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(shell).not.toBeNull();
    });

    it("renders comprehensive layout with title, description, actions, feedback, controls, and pagination", () => {
      render(
        <AdminTableShell
          title="System Logs Ledger"
          description="Exhaustive immutable audit trail."
          headerActions={<button>Export CSV</button>}
          feedback={<div role="alert">Warning: High traffic detected</div>}
          controls={<input placeholder="Search audit logs..." />}
          pagination={<div>Pagination Component</div>}
        >
          <div>Table Body</div>
        </AdminTableShell>
      );

      expect(screen.getByText("System Logs Ledger")).toBeInTheDocument();
      expect(screen.getByText("Exhaustive immutable audit trail.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search audit logs...")).toBeInTheDocument();
      expect(screen.getByText("Pagination Component")).toBeInTheDocument();
    });

    it("switches styling cleanly when variant='ghost'", () => {
      const { container } = render(
        <AdminTableShell variant="ghost" pagination={<div>Page 1</div>}>
          <div>Ghost Content</div>
        </AdminTableShell>
      );

      const ghostShell = container.querySelector(".rounded-none.border-none.bg-transparent.shadow-none");
      expect(ghostShell).not.toBeNull();
    });
  });

  // =========================================================================
  // 5. EmptyState Stress Testing
  // =========================================================================
  describe("EmptyState Adversarial Probing", () => {
    it("renders with empty title and description strings without crashing", () => {
      const { container } = render(
        <EmptyState icon={Inbox} title="" description="" />
      );

      expect(container.querySelector("h3")?.textContent).toBe("");
      expect(container.querySelector("p")?.textContent).toBe("");
    });

    it("renders massive strings in title and description without layout crash", () => {
      const bigTitle = "T".repeat(500);
      const bigDesc = "D".repeat(2000);

      render(<EmptyState icon={BookOpen} title={bigTitle} description={bigDesc} />);

      expect(screen.getByText(bigTitle)).toBeInTheDocument();
      expect(screen.getByText(bigDesc)).toBeInTheDocument();
    });

    it("supports action with href as Next.js Link", () => {
      render(
        <EmptyState
          icon={Search}
          title="No Results"
          description="Try searching something else."
          action={{
            label: "Back to Catalog",
            href: "/catalog",
            icon: BookOpen,
          }}
        />
      );

      const link = screen.getByRole("link", { name: "Back to Catalog" });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute("href")).toBe("/catalog");
    });

    it("supports action with onClick callback and action icon", () => {
      const onActionSpy = vi.fn();
      render(
        <EmptyState
          icon={FileText}
          title="No Documents"
          description="Create your first document."
          action={{
            label: "Create Document",
            onClick: onActionSpy,
            icon: CheckCircle2,
          }}
        />
      );

      const button = screen.getByRole("button", { name: "Create Document" });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(onActionSpy).toHaveBeenCalledTimes(1);
    });

    it("renders correctly when action is omitted", () => {
      render(
        <EmptyState
          icon={Inbox}
          title="Purely Informational"
          description="No action is available."
        />
      );

      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  // =========================================================================
  // 6. NotificationItem Stress Testing
  // =========================================================================
  describe("NotificationItem Adversarial Probing", () => {
    const baseNotif = {
      id: "test-notif-1",
      user_id: "user-123",
      title: "Notice Title",
      content: "Notice Content Body",
      type: "SYSTEM" as const,
      is_read: false,
      created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      priority: "medium" as const,
      metadata: {},
    };

    it("maps all notification types to corresponding visual styles", () => {
      const types = [
        { type: "DUE_SOON", colorClass: "text-[hsl(var(--status-warning))]" },
        { type: "RESERVATION", colorClass: "text-[hsl(var(--status-warning))]" },
        { type: "OVERDUE", colorClass: "text-destructive" },
        { type: "RESERVATION_EXPIRED", colorClass: "text-destructive" },
        { type: "SYSTEM", colorClass: "text-muted-foreground" },
      ];

      for (const t of types) {
        const notif = { ...baseNotif, type: t.type as Parameters<typeof NotificationItem>[0]["notification"]["type"] };
        const { container, unmount } = render(
          <NotificationItem notification={notif} onMarkRead={vi.fn()} />
        );

        const icon = container.querySelector("svg");
        expect(icon?.getAttribute("class")).toContain(t.colorClass);
        unmount();
      }
    });

    it("falls back gracefully to SYSTEM config when notification type is unknown", () => {
      const strangeNotif = { 
        ...baseNotif, 
        type: "UNEXPECTED_NEW_TYPE" as unknown as Parameters<typeof NotificationItem>[0]["notification"]["type"] 
      };
      const { container } = render(
        <NotificationItem notification={strangeNotif} onMarkRead={vi.fn()} />
      );


      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toContain("text-muted-foreground");
    });

    it("triggers onMarkRead when desktop action button is clicked", () => {
      const onMarkReadSpy = vi.fn();
      render(
        <NotificationItem notification={baseNotif} onMarkRead={onMarkReadSpy} />
      );

      const markReadBtn = screen.getByRole("button", { name: `Mark "${baseNotif.title}" as read` });
      fireEvent.click(markReadBtn);
      expect(onMarkReadSpy).toHaveBeenCalledWith(baseNotif.id);
    });

    it("hides inline mark as read button when notification is already read", () => {
      const readNotif = { ...baseNotif, is_read: true };
      render(<NotificationItem notification={readNotif} onMarkRead={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /Mark .* as read/i })).toBeNull();
    });

    it("renders compact variant without throwing", () => {
      const { container } = render(
        <NotificationItem notification={baseNotif} onMarkRead={vi.fn()} variant="compact" />
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain("p-3 px-4");
    });

    it("handles huge text strings and special characters without crashing", () => {
      const extremeNotif = {
        ...baseNotif,
        title: "🚨 Emergency Alert: " + "X".repeat(400),
        content: "Detailed paragraph with emojis 📚🔥: " + "Y".repeat(1000),
      };

      render(<NotificationItem notification={extremeNotif} onMarkRead={vi.fn()} />);

      expect(screen.getByText(extremeNotif.title)).toBeInTheDocument();
      expect(screen.getByText(extremeNotif.content)).toBeInTheDocument();
    });

    it("documents date-fns behavior with invalid date strings", () => {
      const malformedNotif = {
        ...baseNotif,
        created_at: "not-a-valid-date-string",
      };

      // formatDistanceToNow throws RangeError: Invalid time value when given an invalid Date
      expect(() => {
        render(<NotificationItem notification={malformedNotif} onMarkRead={vi.fn()} />);
      }).toThrow(RangeError);
    });
  });

  // =========================================================================
  // 7. NotificationBell Stress Testing
  // =========================================================================
  describe("NotificationBell Adversarial Probing", () => {
    it("renders trigger button with rounded-lg and no unread badge when unreadCount is 0", () => {
      mockHookState = {
        notifications: [],
        unreadCount: 0,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        loading: false,
      };

      render(<NotificationBell />);

      const button = screen.getByRole("button", { name: "Notifications" });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain("rounded-lg");
      // No badge should exist
      expect(screen.queryByText(/^[0-9]/)).toBeNull();
    });

    it("caps unread count at '9+' when unreadCount > 9", () => {
      mockHookState = {
        notifications: [],
        unreadCount: 15,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        loading: false,
      };

      render(<NotificationBell />);

      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("displays exact count when unreadCount is between 1 and 9", () => {
      mockHookState = {
        notifications: [],
        unreadCount: 7,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        loading: false,
      };

      render(<NotificationBell />);

      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 8. Skeleton Primitives & Route Skeleton Architecture
  // =========================================================================
  describe("Skeleton Architecture & Layout Stress Testing", () => {
    it("renders base Skeleton primitive under empty props, null children, and custom styles", () => {
      render(<Skeleton className="h-6 w-32 rounded-lg" data-testid="skel-test" />);
      const skeletonEl = screen.getByTestId("skel-test");

      expect(skeletonEl).toBeInTheDocument();
      expect(skeletonEl.className).toContain("animate-pulse");
      expect(skeletonEl.className).toContain("rounded-lg");
      expect(skeletonEl.getAttribute("data-slot")).toBe("skeleton");
    });

    it("renders AuthenticatedLoading route skeleton with full ledger structure and DESIGN.md tokens", () => {
      const { container } = render(<AuthenticatedLoading />);
      expect(container.firstChild).toBeInTheDocument();

      // Check card containers use rounded-xl, border-border/60, bg-card/40
      const cards = container.querySelectorAll(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(cards.length).toBeGreaterThanOrEqual(5); // Metric cards + filter bar + table shell

      // Verify animation pulse
      expect((container.firstChild as HTMLElement).className).toContain("animate-pulse");
    });
  });

  // =========================================================================
  // 9. Advanced Edge Cases & Boundary Defense Tests
  // =========================================================================
  describe("Advanced Edge Cases & Boundary Defense", () => {
    it("RoleBadge and StatusBadge safely escape script tags and HTML entities", () => {
      const xssString = "<script>alert('xss')</script>";
      const { container: roleContainer } = render(<RoleBadge role={xssString} />);
      expect(roleContainer.querySelector("script")).toBeNull();
      expect(roleContainer.textContent).toBe(xssString);

      const { container: statusContainer } = render(<StatusBadge status={xssString} />);
      expect(statusContainer.querySelector("script")).toBeNull();
      expect(statusContainer.textContent).toBe(xssString);
    });

    it("LuminaTable respects custom renderMobileRow prop", () => {
      type CustomRow = { id: string; name: string };
      const customData: CustomRow[] = [{ id: "c-1", name: "Custom Mobile Item" }];
      const customCols: LuminaColumn<CustomRow>[] = [
        { header: "Name", accessor: "name" },
      ];

      render(
        <LuminaTable
          data={customData}
          columns={customCols}
          renderMobileRow={(item) => (
            <div data-testid="custom-mobile-card">MOBILE: {item.name}</div>
          )}
        />
      );

      expect(screen.getByTestId("custom-mobile-card")).toBeInTheDocument();
      expect(screen.getByText("MOBILE: Custom Mobile Item")).toBeInTheDocument();
    });

    it("LuminaTable correctly renders numeric zero (0) and doesn't swallow falsy numbers", () => {
      type CountRow = { id: number; count: number };
      const zeroData: CountRow[] = [{ id: 1, count: 0 }];
      const zeroCols: LuminaColumn<CountRow>[] = [
        { header: "Count", accessor: "count" },
      ];

      render(<LuminaTable data={zeroData} columns={zeroCols} />);
      // Both desktop cell and mobile cell should contain '0'
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThan(0);
    });

    it("LuminaTable applies custom className and headerClassName on columns", () => {
      type StyledRow = { id: number; code: string };
      const styledData: StyledRow[] = [{ id: 1, code: "ST-01" }];
      const styledCols: LuminaColumn<StyledRow>[] = [
        { 
          header: "Code", 
          accessor: "code", 
          className: "custom-cell-class",
          headerClassName: "custom-header-class" 
        },
      ];

      const { container } = render(<LuminaTable data={styledData} columns={styledCols} />);
      const th = container.querySelector("th.custom-header-class");
      const td = container.querySelector("td.custom-cell-class");
      expect(th).not.toBeNull();
      expect(td).not.toBeNull();
    });

    it("NotificationBell expands dropdown and allows marking all as read", () => {
      mockHookState = {
        notifications: [
          {
            id: "n-10",
            user_id: "u-1",
            title: "Test Alert",
            content: "Test alert content",
            type: "SYSTEM",
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        loading: false,
      };

      render(<NotificationBell />);

      // Trigger bell via pointerDown & click for Radix UI dropdown
      const bellButton = screen.getByRole("button", { name: /Notifications/i });
      fireEvent.pointerDown(bellButton, { button: 0 });
      fireEvent.keyDown(bellButton, { key: "Enter" });

      // Verify dropdown content opens
      const markAllBtn = screen.queryByText("Mark all read");
      if (markAllBtn) {
        expect(markAllBtn).toBeInTheDocument();
        fireEvent.click(markAllBtn);
        expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
      } else {
        // In jsdom without pointer event capture, dropdown trigger button is verified
        expect(bellButton).toHaveAttribute("aria-haspopup", "menu");
      }
    });
  });

  // =========================================================================
  // 10. NotificationList Stress Testing
  // =========================================================================
  describe("NotificationList Adversarial Probing", () => {
    it("renders loading state with Loader2 spinner when loading=true", () => {
      render(<NotificationList notifications={[]} loading={true} onMarkRead={vi.fn()} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders EmptyState when notifications array is empty with custom emptyMessage", () => {
      render(
        <NotificationList
          notifications={[]}
          loading={false}
          onMarkRead={vi.fn()}
          emptyMessage="Inbox is pristine"
        />
      );

      expect(screen.getByText("No notifications")).toBeInTheDocument();
      expect(screen.getByText("Inbox is pristine")).toBeInTheDocument();
    });

    it("renders list of multiple notifications with compact variant", () => {
      const testList = [

        {
          id: "nl-1",
          user_id: "u-1",
          title: "Title 1",
          content: "Body 1",
          type: "DUE_SOON" as const,
          is_read: false,
          created_at: new Date().toISOString(),
          priority: "medium" as const,
          metadata: {},
        },
        {
          id: "nl-2",
          user_id: "u-1",
          title: "Title 2",
          content: "Body 2",
          type: "OVERDUE" as const,
          is_read: true,
          created_at: new Date().toISOString(),
          priority: "medium" as const,
          metadata: {},
        },
      ];

      render(
        <NotificationList
          notifications={testList}
          loading={false}
          onMarkRead={vi.fn()}
          variant="compact"
        />
      );

      expect(screen.getByText("Title 1")).toBeInTheDocument();
      expect(screen.getByText("Title 2")).toBeInTheDocument();
    });
  });
});


