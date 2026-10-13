import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Components under test
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LuminaTable, type LuminaColumn } from "@/components/common/LuminaTable";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmptyState } from "@/components/ui/empty-state";
import AuthenticatedLoading from "@/app/(authenticated)/loading";

import { BookOpen, AlertCircle } from "lucide-react";

// Dynamic mock for useNotifications to test edge cases
let mockUnreadCount = 3;
let mockNotifications = [
  {
    id: "notif-1",
    user_id: "user-1",
    title: "Book Due Soon",
    content: "Return volume by tomorrow",
    type: "DUE_SOON",
    is_read: false,
    created_at: new Date().toISOString(),
    priority: "medium",
    metadata: {},
  },
  {
    id: "notif-2",
    user_id: "user-1",
    title: "Overdue Notice",
    content: "Volume is overdue",
    type: "OVERDUE",
    is_read: false,
    created_at: new Date().toISOString(),
    priority: "high",
    metadata: {},
  },
  {
    id: "notif-3",
    user_id: "user-1",
    title: "Reservation Ready",
    content: "Hold ready for pickup",
    type: "RESERVATION",
    is_read: true,
    created_at: new Date().toISOString(),
    priority: "medium",
    metadata: {},
  },
  {
    id: "notif-4",
    user_id: "user-1",
    title: "Hold Expired",
    content: "Reservation expired",
    type: "RESERVATION_EXPIRED",
    is_read: false,
    created_at: new Date().toISOString(),
    priority: "medium",
    metadata: {},
  },
];
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    loading: false,
  }),
}));

describe("Adversarial Invariant Verification Suite — Milestone 2", () => {
  // =========================================================================
  // 1. Monochromatic Neutral Invariants for RoleBadge
  // =========================================================================
  describe("1. RoleBadge Monochromatic Neutral Invariants", () => {
    const testRoles = [
      "super_admin",
      "admin",
      "librarian",
      "staff",
      "student_assistant",
      "student",
      "patron",
      "SUPER_ADMIN",
      "Librarian",
      "STUDENT_ASSISTANT",
      "unknown_role",
      "guest",
      "",
      "   ",
      "vendor",
      "auditor",
      "12345",
      "<script>alert(1)</script>",
    ];

    it.each(testRoles)(
      "enforces monochromatic neutral styling and no colored classes for role: %j",
      (role) => {
        const { container } = render(<RoleBadge role={role} />);
        const badge = container.firstChild as HTMLElement;

        expect(badge).toBeInTheDocument();

        // Must contain institutional neutral tokens
        expect(badge.className).toContain("rounded-lg");
        expect(badge.className).toContain("border-border/60");
        expect(badge.className).toContain("bg-muted");
        expect(badge.className).toContain("text-foreground");
        expect(badge.className).toContain("text-xs font-semibold uppercase tracking-wider");

        // Must NEVER contain non-neutral or role-tinted color classes
        expect(badge.className).not.toContain("text-blue-");
        expect(badge.className).not.toContain("text-indigo-");
        expect(badge.className).not.toContain("text-emerald-");
        expect(badge.className).not.toContain("text-amber-");
        expect(badge.className).not.toContain("text-red-");
        expect(badge.className).not.toContain("bg-blue-");
        expect(badge.className).not.toContain("bg-indigo-");

        // Must NEVER have non-standard radiuses
        expect(badge.className).not.toContain("rounded-2xl");
        expect(badge.className).not.toContain("rounded-3xl");
        expect(badge.className).not.toContain("rounded-md");
        expect(badge.className).not.toContain("rounded-full");
      }
    );

    it("safely handles custom className without breaking default neutral tokens", () => {
      const { container } = render(
        <RoleBadge role="librarian" className="shadow-xs cursor-pointer" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("shadow-xs");
      expect(badge.className).toContain("cursor-pointer");
      expect(badge.className).toContain("rounded-lg");
      expect(badge.className).toContain("text-foreground");
    });
  });

  // =========================================================================
  // 2. Semantic Status Color Invariants for StatusBadge
  // =========================================================================
  describe("2. StatusBadge Semantic Color Invariants", () => {
    const validStatuses = [
      // General/User
      { input: "active", expectedStyle: "status-success" },
      { input: "ACTIVE", expectedStyle: "status-warning" }, // In reservation/general logic ACTIVE is warning
      { input: "pending", expectedStyle: "status-warning" },
      { input: "PENDING", expectedStyle: "status-warning" },
      { input: "suspended", expectedStyle: "status-danger" },
      { input: "SUSPENDED", expectedStyle: "status-danger" },
      { input: "archived", expectedStyle: "status-neutral" },
      { input: "ARCHIVED", expectedStyle: "status-neutral" },
      { input: "graduated", expectedStyle: "status-neutral" },
      { input: "GRADUATED", expectedStyle: "status-neutral" },
      // Book Copies
      { input: "AVAILABLE", expectedStyle: "status-success" },
      { input: "available", expectedStyle: "status-success" },
      { input: "BORROWED", expectedStyle: "status-warning" },
      { input: "borrowed", expectedStyle: "status-warning" },
      { input: "MAINTENANCE", expectedStyle: "status-warning" },
      { input: "maintenance", expectedStyle: "status-warning" },
      { input: "LOST", expectedStyle: "status-danger" },
      { input: "lost", expectedStyle: "status-danger" },
      // Circulation/Reservations
      { input: "READY", expectedStyle: "status-success" },
      { input: "ready", expectedStyle: "status-success" },
      { input: "CANCELLED", expectedStyle: "status-neutral" },
      { input: "cancelled", expectedStyle: "status-neutral" },
      { input: "COMPLETED", expectedStyle: "status-neutral" },
      { input: "completed", expectedStyle: "status-neutral" },
      { input: "EXPIRED", expectedStyle: "status-danger" },
      { input: "expired", expectedStyle: "status-danger" },
      { input: "RETURNED", expectedStyle: "status-success" },
      { input: "returned", expectedStyle: "status-success" },
      { input: "OVERDUE", expectedStyle: "status-danger" },
      { input: "overdue", expectedStyle: "status-danger" },
      // Unknown / edge cases fallback
      { input: "NON_EXISTENT_STATUS", expectedStyle: "status-neutral" },
      { input: "", expectedStyle: "status-neutral" },
      { input: "foo_bar_status", expectedStyle: "status-neutral" },
    ];

    it.each(validStatuses)(
      "maps status $input strictly to institutional token $expectedStyle",
      ({ input, expectedStyle }) => {
        const { container } = render(<StatusBadge status={input} />);
        const badge = container.firstChild as HTMLElement;

        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain(expectedStyle);

        // Invariant: MUST be rounded-lg (8px)
        expect(badge.className).toContain("rounded-lg");
        expect(badge.className).not.toContain("rounded-full");
        expect(badge.className).not.toContain("rounded-2xl");
        expect(badge.className).not.toContain("rounded-3xl");
        expect(badge.className).not.toContain("rounded-md");

        // Invariant: typography must be text-xs uppercase
        expect(badge.className).toContain("text-xs font-semibold uppercase tracking-wider");
        expect(badge.className).not.toContain("text-[10px]");
        expect(badge.className).not.toContain("text-[11px]");

        // Invariant: MUST NOT contain raw tailwind color overrides
        expect(badge.className).not.toContain("bg-amber-100");
        expect(badge.className).not.toContain("bg-emerald-50");
        expect(badge.className).not.toContain("border-amber-200");
        expect(badge.className).not.toContain("text-amber-");
        expect(badge.className).not.toContain("text-emerald-");
        expect(badge.className).not.toContain("text-blue-");
      }
    );
  });

  // =========================================================================
  // 3. Shared Tables & Shells Radius and Structural Invariants
  // =========================================================================
  describe("3. Shared Table Shells Invariant Verification", () => {
    interface SampleData {
      id: string;
      title: string;
      isbn: string;
      stock: number;
    }

    const columns: LuminaColumn<SampleData>[] = [
      { header: "Book Title", accessor: "title", mobileMain: true },
      { header: "ISBN Code", accessor: "isbn" },
      { header: "In Stock", accessor: "stock" },
    ];

    const dataset: SampleData[] = [
      { id: "b1", title: "Clean Architecture", isbn: "978-0134494166", stock: 5 },
      { id: "b2", title: "Domain-Driven Design", isbn: "978-0321125217", stock: 2 },
    ];

    it("LuminaTable enforces container rounded-xl, border-border/60, and bg-card/40", () => {
      const { container } = render(<LuminaTable data={dataset} columns={columns} />);
      const shell = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40.shadow-sm");
      expect(shell).not.toBeNull();

      // Check table header invariant
      const thList = container.querySelectorAll("th");
      expect(thList.length).toBeGreaterThan(0);
      thList.forEach((th) => {
        expect(th.className).toContain("text-xs font-semibold uppercase tracking-wider text-muted-foreground");
        expect(th.className).not.toContain("text-[10px]");
        expect(th.className).not.toContain("text-[11px]");
      });

      // Assert no child has illegal radiuses
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const cls = el.className;
        if (typeof cls === "string") {
          expect(cls).not.toContain("rounded-2xl");
          expect(cls).not.toContain("rounded-3xl");
        }
      });
    });

    it("LuminaTable with noBorder renders without container styling", () => {
      const { container } = render(<LuminaTable data={dataset} columns={columns} noBorder />);
      const shell = container.querySelector(".border-none.bg-transparent.shadow-none");
      expect(shell).not.toBeNull();
    });

    it("LuminaTable empty state renders canonical EmptyState within table cell", () => {
      const { container } = render(
        <LuminaTable
          data={[]}
          columns={columns}
          emptyState={{
            title: "Empty Shelf",
            description: "No volumes currently cataloged",
            icon: BookOpen,
          }}
        />
      );

      expect(screen.getAllByText("Empty Shelf").length).toBeGreaterThan(0);
      expect(screen.getAllByText("No volumes currently cataloged").length).toBeGreaterThan(0);

      // Verify no illegal radiuses
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const cls = el.className;
        if (typeof cls === "string") {
          expect(cls).not.toContain("rounded-2xl");
          expect(cls).not.toContain("rounded-3xl");
        }
      });
    });

    it("AdminTableShell enforces container rounded-xl, border-border/60, and bg-card/40", () => {
      const { container } = render(
        <AdminTableShell
          title="Catalog Operations"
          description="Manage books and resources"
          controls={<div data-testid="filter-box">Filters</div>}
          pagination={<div data-testid="page-nav">Pages</div>}
        >
          <div data-testid="table-contents">Table Body</div>
        </AdminTableShell>
      );

      // Main container
      const card = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40.shadow-sm");
      expect(card).not.toBeNull();

      // Controls container
      const controlsBox = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40.p-2");
      expect(controlsBox).not.toBeNull();

      // Check dividers
      const divider = container.querySelector(".border-b.border-border\\/40");
      expect(divider).not.toBeNull();

      // Assert no child has illegal radiuses
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const cls = el.className;
        if (typeof cls === "string") {
          expect(cls).not.toContain("rounded-2xl");
          expect(cls).not.toContain("rounded-3xl");
        }
      });
    });

    it("AdminTableShell supports ghost variant without borders/shadows", () => {
      const { container } = render(
        <AdminTableShell variant="ghost">
          <div>Ghost Content</div>
        </AdminTableShell>
      );
      const ghostShell = container.querySelector(".rounded-none.border-none.bg-transparent.shadow-none");
      expect(ghostShell).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Notifications Radius & Status Color Invariants
  // =========================================================================
  describe("4. Notifications Invariant Verification", () => {
    it("NotificationBell enforces rounded-lg trigger button and rounded-xl dropdown menu", () => {
      mockUnreadCount = 4;
      render(<NotificationBell />);

      const bellBtn = screen.getByRole("button", { name: /Notifications/i });
      expect(bellBtn.className).toContain("rounded-lg");
      expect(bellBtn.className).not.toContain("rounded-xl");
      expect(bellBtn.className).not.toContain("rounded-2xl");

      // Badge must be rounded-lg
      const badge = bellBtn.querySelector(".rounded-lg");
      expect(badge).not.toBeNull();
      expect(badge?.className).not.toContain("rounded-full");
    });

    it("NotificationBell displays 9+ when unread count exceeds 9", () => {
      mockUnreadCount = 15;
      render(<NotificationBell />);
      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("NotificationItem strictly maps types to Warning Amber and Critical Crimson", () => {
      // 1. DUE_SOON -> Warning Amber
      const { container: dueSoonContainer } = render(
        <NotificationItem
          notification={{
            id: "1",
            user_id: "u1",
            title: "Due Soon",
            content: "Return volume soon",
            type: "DUE_SOON",
            is_read: false,
            created_at: new Date().toISOString(),
            priority: "medium",
            metadata: {},
          }}
          onMarkRead={vi.fn()}
        />
      );
      const dueSoonIcon = dueSoonContainer.querySelector("svg");
      expect(dueSoonIcon?.getAttribute("class")).toContain("text-[hsl(var(--status-warning))]");

      // 2. RESERVATION -> Warning Amber
      const { container: resContainer } = render(
        <NotificationItem
          notification={{
            id: "2",
            user_id: "u1",
            title: "Hold Ready",
            content: "Pick up hold",
            type: "RESERVATION",
            is_read: false,
            created_at: new Date().toISOString(),
            priority: "medium",
            metadata: {},
          }}
          onMarkRead={vi.fn()}
        />
      );
      const resIcon = resContainer.querySelector("svg");
      expect(resIcon?.getAttribute("class")).toContain("text-[hsl(var(--status-warning))]");

      // 3. OVERDUE -> Critical Crimson (text-destructive)
      const { container: overdueContainer } = render(
        <NotificationItem
          notification={{
            id: "3",
            user_id: "u1",
            title: "Overdue",
            content: "Volume is overdue",
            type: "OVERDUE",
            is_read: false,
            created_at: new Date().toISOString(),
            priority: "high",
            metadata: {},
          }}
          onMarkRead={vi.fn()}
        />
      );
      const overdueIcon = overdueContainer.querySelector("svg");
      expect(overdueIcon?.getAttribute("class")).toContain("text-destructive");

      // 4. RESERVATION_EXPIRED -> Critical Crimson (text-destructive)
      const { container: expContainer } = render(
        <NotificationItem
          notification={{
            id: "4",
            user_id: "u1",
            title: "Expired",
            content: "Hold expired",
            type: "RESERVATION_EXPIRED",
            is_read: false,
            created_at: new Date().toISOString(),
            priority: "medium",
            metadata: {},
          }}
          onMarkRead={vi.fn()}
        />
      );
      const expIcon = expContainer.querySelector("svg");
      expect(expIcon?.getAttribute("class")).toContain("text-destructive");

      // Check actions trigger button has rounded-lg
      const moreBtn = expContainer.querySelector("button.rounded-lg");
      expect(moreBtn).not.toBeNull();
      expect(moreBtn?.className).not.toContain("rounded-2xl");
    });
  });

  // =========================================================================
  // 5. Universal EmptyState Invariants
  // =========================================================================
  describe("5. Universal EmptyState Invariants", () => {
    it("EmptyState renders with standard typography and rounded-lg action button", () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          icon={AlertCircle}
          title="System Outage"
          description="Catalog services are temporarily offline."
          action={{
            label: "Retry Connection",
            onClick: onAction,
          }}
        />
      );

      expect(screen.getByText("System Outage")).toBeInTheDocument();
      expect(screen.getByText("Catalog services are temporarily offline.")).toBeInTheDocument();

      const btn = screen.getByRole("button", { name: "Retry Connection" });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("rounded-lg");
      expect(btn.className).not.toContain("rounded-2xl");
      expect(btn.className).not.toContain("rounded-3xl");

      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("EmptyState action works with link href", () => {
      render(
        <EmptyState
          icon={BookOpen}
          title="No Books"
          description="No catalog volumes found."
          action={{
            label: "Browse Library",
            href: "/catalog",
          }}
        />
      );

      const link = screen.getByRole("link", { name: "Browse Library" });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute("href")).toBe("/catalog");
      expect(link.className).toContain("rounded-lg");
    });
  });

  // =========================================================================
  // 6. Route Skeletons Structure, Accessibility & Radius Invariants
  // =========================================================================
  describe("6. Route Skeletons Invariants & Static Verification", () => {
    it("AuthenticatedLoading skeleton renders with animate-pulse and rounded-xl containers", () => {
      const { container } = render(<AuthenticatedLoading />);
      expect(container.firstChild).toHaveClass("animate-pulse");

      // Verify metric cards use rounded-xl border border-border/60 bg-card/40
      const cards = container.querySelectorAll(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(cards.length).toBeGreaterThanOrEqual(6); // 4 metrics + 1 filter bar + 1 table shell

      // Verify no element contains illegal radiuses
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const cls = el.className;
        if (typeof cls === "string") {
          expect(cls).not.toContain("rounded-2xl");
          expect(cls).not.toContain("rounded-3xl");
        }
      });
    });

    const routeSkeletonDefinitions = [
      {
        path: "app/(authenticated)/users/new/page.tsx",
        skeletonName: "NewUserSkeleton",
      },
      {
        path: "app/(authenticated)/users/[id]/page.tsx",
        skeletonName: "UserDetailSkeleton",
      },
      {
        path: "app/(authenticated)/policies/page.tsx",
        skeletonName: "PoliciesSkeleton",
      },
      {
        path: "app/(authenticated)/profile/page.tsx",
        skeletonName: "ProfileSkeleton",
      },
      {
        path: "app/(authenticated)/security/page.tsx",
        skeletonName: "SecuritySkeleton",
      },
      {
        path: "app/(authenticated)/catalog/layout.tsx",
        skeletonName: "CatalogLayoutSkeleton",
      },
      {
        path: "app/(authenticated)/loading.tsx",
        skeletonName: "AuthenticatedLoading",
      },
      {
        path: "app/(authenticated)/circulation/page.tsx",
        skeletonName: "CirculationPageSkeleton",
      },
      {
        path: "app/(authenticated)/attendance/page.tsx",
        skeletonName: "AttendanceSkeleton",
      },
      {
        path: "app/(authenticated)/student-catalog/[id]/page.tsx",
        skeletonName: "BookDetailSkeleton",
      },
    ];

    it.each(routeSkeletonDefinitions)(
      "verifies skeleton in $path adheres to DESIGN.md tokens and radius invariants",
      ({ path: relPath, skeletonName }) => {
        const fullPath = path.resolve(__dirname, "..", relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, "utf-8");

        // 1. Verify skeleton component definition exists
        expect(content).toContain(skeletonName);

        // 2. Extract skeleton function content
        const funcRegex = new RegExp(
          `(?:function\\s+${skeletonName}|export\\s+default\\s+function\\s+${skeletonName})[\\s\\S]*?\\n\\}`
        );
        const match = content.match(funcRegex);
        expect(match).not.toBeNull();
        const skeletonBody = match![0];

        // 3. Verify animate-pulse exists
        expect(skeletonBody).toContain("animate-pulse");

        // 4. Verify rounded-xl container exists
        expect(skeletonBody).toContain("rounded-xl");

        // 5. Invariant: ZERO rounded-2xl or rounded-3xl inside skeleton
        expect(skeletonBody).not.toContain("rounded-2xl");
        expect(skeletonBody).not.toContain("rounded-3xl");

        // 6. Invariant: Border styling uses border-border/60 or border-border
        expect(skeletonBody).toMatch(/border-border(\/60)?/);
      }
    );
  });
});
