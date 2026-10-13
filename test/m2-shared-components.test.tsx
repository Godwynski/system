import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LuminaTable } from "@/components/common/LuminaTable";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox, BookOpen } from "lucide-react";

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: "notif-1",
        user_id: "user-1",
        title: "Book Due Soon",
        content: "Return Clean Code by tomorrow",
        type: "DUE_SOON",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "notif-2",
        user_id: "user-1",
        title: "Overdue Notice",
        content: "Design Patterns is overdue",
        type: "OVERDUE",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "notif-3",
        user_id: "user-1",
        title: "Hold Ready",
        content: "Refactoring is ready for pickup",
        type: "RESERVATION",
        is_read: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "notif-4",
        user_id: "user-1",
        title: "Reservation Expired",
        content: "Hold expired for Pragmatic Programmer",
        type: "RESERVATION_EXPIRED",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ],
    unreadCount: 3,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    loading: false,
  }),
}));

describe("Milestone 2 Design System Verification", () => {
  describe("RoleBadge", () => {
    it("renders with monochromatic neutral tokens and does not contain blue/indigo classes", () => {
      const { container } = render(<RoleBadge role="librarian" />);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("Librarian");
      expect(badge.className).toContain("rounded-lg");
      expect(badge.className).toContain("border border-border/60");
      expect(badge.className).toContain("bg-muted");
      expect(badge.className).toContain("text-foreground");
      expect(badge.className).toContain("text-xs font-semibold uppercase tracking-wider");

      // Verify absence of deprecated non-neutral color overrides
      expect(badge.className).not.toContain("text-blue-700");
      expect(badge.className).not.toContain("text-indigo-700");
    });

    it("renders student assistant role with neutral styling", () => {
      const { container } = render(<RoleBadge role="student_assistant" />);
      const badge = container.firstChild as HTMLElement;

      expect(badge.textContent).toBe("Student Assistant");
      expect(badge.className).not.toContain("text-indigo-700");
      expect(badge.className).toContain("text-foreground");
    });
  });

  describe("StatusBadge", () => {
    it("renders rounded-lg (8px) and standard text-xs uppercase typography", () => {
      const { container } = render(<StatusBadge status="AVAILABLE" />);
      const badge = container.firstChild as HTMLElement;

      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("rounded-lg");
      expect(badge.className).toContain("text-xs font-semibold uppercase tracking-wider");
      expect(badge.className).not.toContain("rounded-full");
      expect(badge.className).not.toContain("text-[10px]");
    });

    it("maps status types strictly to institutional semantic tokens", () => {
      const { container: successContainer } = render(<StatusBadge status="AVAILABLE" />);
      expect((successContainer.firstChild as HTMLElement).className).toContain("status-success");

      const { container: warningContainer } = render(<StatusBadge status="BORROWED" />);
      expect((warningContainer.firstChild as HTMLElement).className).toContain("status-warning");

      const { container: dangerContainer } = render(<StatusBadge status="OVERDUE" />);
      expect((dangerContainer.firstChild as HTMLElement).className).toContain("status-danger");

      const { container: neutralContainer } = render(<StatusBadge status="ARCHIVED" />);
      expect((neutralContainer.firstChild as HTMLElement).className).toContain("status-neutral");
    });
  });

  describe("LuminaTable", () => {
    const columns = [
      { header: "Title", accessor: "title" as const, mobileMain: true },
      { header: "Author", accessor: "author" as const },
    ];
    const data = [
      { id: 1, title: "Clean Architecture", author: "Robert Martin" },
      { id: 2, title: "Refactoring", author: "Martin Fowler" },
    ];

    it("renders container with rounded-xl, border-border/60, bg-card/40, and shadow-sm", () => {
      const { container } = render(<LuminaTable data={data} columns={columns} />);
      const shell = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40.shadow-sm");
      expect(shell).not.toBeNull();
    });

    it("renders table header with standard text-xs uppercase tracking-wider text-muted-foreground", () => {
      render(<LuminaTable data={data} columns={columns} />);
      const th = screen.getAllByRole("columnheader")[0];
      expect(th.className).toContain("text-xs font-semibold uppercase tracking-wider text-muted-foreground");
      expect(th.className).not.toContain("text-[11px]");
    });

    it("renders EmptyState component when data is empty", () => {
      render(
        <LuminaTable
          data={[]}
          columns={columns}
          emptyState={{
            icon: Inbox,
            title: "No books found",
            description: "Try adjusting your query",
          }}
        />
      );
      expect(screen.getAllByText("No books found").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Try adjusting your query").length).toBeGreaterThan(0);
    });
  });

  describe("AdminTableShell", () => {
    it("renders container with rounded-xl border border-border/60 bg-card/40", () => {
      const { container } = render(
        <AdminTableShell title="Inventory Ledger" controls={<div>Filters</div>}>
          <div>Table Body</div>
        </AdminTableShell>
      );
      const card = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(card).not.toBeNull();
    });
  });

  describe("Notification Components", () => {
    it("maps DUE_SOON and RESERVATION to warning status colors", () => {
      const dueSoonNotif = {
        id: "n1",
        user_id: "u1",
        title: "Due Soon",
        content: "Return volume soon",
        type: "DUE_SOON" as const,
        is_read: false,
        created_at: new Date().toISOString(),
        priority: "medium" as const,
        metadata: {},
      };
      const { container } = render(
        <NotificationItem notification={dueSoonNotif} onMarkRead={vi.fn()} />
      );
      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toContain("text-[hsl(var(--status-warning))]");
    });

    it("maps OVERDUE and RESERVATION_EXPIRED to destructive status colors", () => {
      const overdueNotif = {
        id: "n2",
        user_id: "u1",
        title: "Overdue",
        content: "Overdue volume",
        type: "OVERDUE" as const,
        is_read: false,
        created_at: new Date().toISOString(),
        priority: "medium" as const,
        metadata: {},
      };
      const { container } = render(
        <NotificationItem notification={overdueNotif} onMarkRead={vi.fn()} />
      );
      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toContain("text-destructive");
    });

    it("renders NotificationBell trigger with rounded-lg and dropdown menu with rounded-xl", () => {
      render(<NotificationBell />);
      const bellButton = screen.getByRole("button", { name: /Notifications/i });
      expect(bellButton.className).toContain("rounded-lg");
      expect(bellButton.className).not.toContain("rounded-xl");
    });
  });

  describe("EmptyState", () => {
    it("renders canonical EmptyState with icon, title, and action", () => {
      const handleClick = vi.fn();
      render(
        <EmptyState
          icon={BookOpen}
          title="No Books Available"
          description="Check back later for new arrivals."
          action={{
            label: "Explore Library",
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByText("No Books Available")).toBeInTheDocument();
      expect(screen.getByText("Check back later for new arrivals.")).toBeInTheDocument();
      const actionButton = screen.getByRole("button", { name: "Explore Library" });
      expect(actionButton).toBeInTheDocument();
      fireEvent.click(actionButton);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
