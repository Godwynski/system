import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks for Next.js and Subsystem Hooks
// ─────────────────────────────────────────────────────────────────────────────

const mockPathname = vi.fn(() => "/dashboard");
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("@/hooks/use-search-params-lite", () => ({
  useSearchParamsLite: () => mockSearchParams(),
}));

const mockLogout = vi.fn();
vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({
    logout: mockLogout,
    isLoggingOut: false,
  }),
}));

const mockPreferencesContext = {
  preferences: {},
  loading: false,
  updatePreferences: vi.fn(),
  refreshPreferences: vi.fn(),
  role: "student" as string | null,
  profile: {
    id: "usr_1",
    full_name: "Jane Student",
    avatar_url: null,
    status: "ACTIVE",
    role: "student",
    permissions: {},
    updated_at: "2026-10-11T00:00:00Z",
  } as unknown as { [key: string]: unknown } | null,
  currentMode: "student" as "staff" | "student",
};

vi.mock("@/components/providers/PreferencesProvider", () => ({
  usePreferences: () => mockPreferencesContext,
  PreferencesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    loading: false,
  }),
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell">NotificationBell</div>,
}));

// Mock sidebar state for testing collapsed vs expanded
let mockSidebarState: "expanded" | "collapsed" = "expanded";

// Setup matchMedia and ResizeObserver polyfills for JSDOM
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock("@/components/ui/sidebar", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useSidebar: () => ({
      state: mockSidebarState,
      open: mockSidebarState === "expanded",
      setOpen: vi.fn(),
      openMobile: false,
      setOpenMobile: vi.fn(),
      isMobile: false,
      toggleSidebar: vi.fn(),
    }),
  };
});

// Import Layout & Navigation Components under review
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { MainHeader } from "@/components/layout/MainHeader";
import { UserNav } from "@/components/layout/UserNav";
import { ProtectedNav } from "@/components/layout/ProtectedNav";
import { SidebarProvider } from "@/components/ui/sidebar";

// ─────────────────────────────────────────────────────────────────────────────
// Adversarial Test Suite: Milestone 1 Navigation Shell & Responsive Layout
// ─────────────────────────────────────────────────────────────────────────────

describe("Challenger M1-2: Navigation Shell, Responsive Layout & Dead Code Elimination", () => {
  const repoRoot = path.resolve(__dirname, "..");

  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarState = "expanded";
    mockPathname.mockReturnValue("/dashboard");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockPreferencesContext.role = "student";
    mockPreferencesContext.profile = {
      id: "usr_1",
      full_name: "Jane Student",
      avatar_url: null,
      status: "ACTIVE",
      role: "student",
      permissions: {},
      updated_at: "2026-10-11T00:00:00Z",
    };
  });

  // =========================================================================
  // Challenge 1: Dead Code Elimination Static Invariants
  // =========================================================================
  describe("Challenge 1: Dead Code Elimination & Clean Imports", () => {
    it("confirms components/env-var-warning.tsx is completely eliminated from the filesystem", () => {
      const deadFilePath = path.join(repoRoot, "components", "env-var-warning.tsx");
      expect(fs.existsSync(deadFilePath)).toBe(false);
    });

    it("verifies zero references to env-var-warning exist across all source files", () => {
      const sourceDirs = ["app", "components", "lib"];
      const findReferences = (dir: string): string[] => {
        const fullPath = path.join(repoRoot, dir);
        if (!fs.existsSync(fullPath)) return [];
        let hits: string[] = [];
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          const res = path.join(fullPath, entry.name);
          if (entry.isDirectory()) {
            hits = hits.concat(findReferences(path.join(dir, entry.name)));
          } else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
            const content = fs.readFileSync(res, "utf-8");
            if (content.includes("env-var-warning")) {
              hits.push(res);
            }
          }
        }
        return hits;
      };

      const matchedFiles = sourceDirs.flatMap(findReferences);
      expect(matchedFiles).toEqual([]);
    });

    it("verifies app/globals.css has purged all orphaned status and keyframe rules", () => {
      const globalsCss = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf-8");
      
      const orphanedClasses = [
        ".status-dot-success",
        ".status-dot-warning",
        ".status-dot-danger",
        ".status-fill-success",
        ".status-fill-warning",
        ".status-fill-danger",
      ];
      for (const cls of orphanedClasses) {
        expect(globalsCss).not.toContain(cls);
      }

      const orphanedKeyframes = [
        "keyframes pulse-bright",
        "keyframes slideUp",
        "keyframes shake",
        "keyframes float",
        "keyframes scan",
      ];
      for (const kf of orphanedKeyframes) {
        expect(globalsCss).not.toContain(kf);
      }
    });

    it("verifies components/layout has zero arbitrary typography off-ramps (text-[...])", () => {
      const layoutDir = path.join(repoRoot, "components", "layout");
      const files = fs.readdirSync(layoutDir).filter(f => /\.(tsx?)$/.test(f));
      
      const arbitraryTextRegex = /text-\[\d+px\]/g;
      const violations: { file: string; matches: string[] }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(path.join(layoutDir, file), "utf-8");
        const matches = content.match(arbitraryTextRegex);
        if (matches) {
          violations.push({ file, matches });
        }
      }

      expect(violations).toEqual([]);
    });

    it("verifies components/layout uses institutional token text-destructive instead of text-red-600", () => {
      const layoutDir = path.join(repoRoot, "components", "layout");
      const files = fs.readdirSync(layoutDir).filter(f => /\.(tsx?)$/.test(f));

      for (const file of files) {
        const content = fs.readFileSync(path.join(layoutDir, file), "utf-8");
        expect(content).not.toContain("text-red-600");
      }
    });

    it("verifies app/globals.css defines --radius: 0.5rem so rounded-lg evaluates to 8px and rounded-xl to 12px", () => {
      const globalsCss = fs.readFileSync(path.join(repoRoot, "app", "globals.css"), "utf-8");
      expect(globalsCss).toMatch(/--radius:\s*0\.5rem;/);
    });
  });

  // =========================================================================
  // Challenge 2: BreadcrumbNav Adversarial & Responsive Edge Cases
  // =========================================================================
  describe("Challenge 2: BreadcrumbNav Route Mapping & Responsive Behavior", () => {
    it("renders h1 heading 'Dashboard' for root /dashboard route", () => {
      mockPathname.mockReturnValue("/dashboard");
      render(<BreadcrumbNav />);
      const heading = screen.getByRole("heading", { level: 1, name: "Dashboard" });
      expect(heading).toBeInTheDocument();
      expect(heading.className).toContain("text-sm font-semibold tracking-tight text-foreground md:text-base");
    });

    it("renders mapped human-readable labels for standard module routes", () => {
      const testCases = [
        { path: "/student-catalog", expected: "Catalog" },
        { path: "/inventory", expected: "Inventory" },
        { path: "/circulation", expected: "Circulation Desk" },
        { path: "/users", expected: "User Directory" },
        { path: "/policies", expected: "System Policies" },
        { path: "/audit", expected: "Audit Logs" },
        { path: "/preferences", expected: "Preferences" },
      ];

      for (const { path: routePath, expected } of testCases) {
        mockPathname.mockReturnValue(routePath);
        const { unmount } = render(<BreadcrumbNav />);
        expect(screen.getByRole("heading", { level: 1, name: expected })).toBeInTheDocument();
        unmount();
      }
    });

    it("handles dynamic UUID segments with context-aware labels", () => {
      const dynamicCases = [
        { path: "/student-catalog/b1a8d0b2-4d1e-450a-8d3e-908123456789", expected: "Book Details" },
        { path: "/catalog/b1a8d0b2-4d1e-450a-8d3e-908123456789", expected: "Book Details" },
        { path: "/users/b1a8d0b2-4d1e-450a-8d3e-908123456789", expected: "User Profile" },
        { path: "/audit/b1a8d0b2-4d1e-450a-8d3e-908123456789", expected: "Log Entry" },
        { path: "/unknown-module/b1a8d0b2-4d1e-450a-8d3e-908123456789", expected: "Details" },
      ];

      for (const { path: routePath, expected } of dynamicCases) {
        mockPathname.mockReturnValue(routePath);
        const { unmount } = render(<BreadcrumbNav />);
        expect(screen.getByRole("heading", { level: 1, name: expected })).toBeInTheDocument();
        unmount();
      }
    });

    it("handles action segments like /users/new and /catalog/add with contextual action labels", () => {
      mockPathname.mockReturnValue("/users/new");
      const { unmount: u1 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "Invite User" })).toBeInTheDocument();
      u1();

      mockPathname.mockReturnValue("/catalog/add");
      const { unmount: u2 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "Add Asset" })).toBeInTheDocument();
      u2();
    });

    it("dynamically adapts /history title based on user role and view query parameter", () => {
      // Student on /history -> "My Borrowing"
      mockPathname.mockReturnValue("/history");
      mockPreferencesContext.role = "student";
      const { unmount: u1 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "My Borrowing" })).toBeInTheDocument();
      u1();

      // Librarian on /history -> "Borrowing Logs"
      mockPreferencesContext.role = "librarian";
      mockSearchParams.mockReturnValue(new URLSearchParams("view=logs"));
      const { unmount: u2 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "Borrowing Logs" })).toBeInTheDocument();
      u2();

      // Student Assistant with view=logs -> "Borrowing Logs"
      mockPreferencesContext.role = "student_assistant";
      mockSearchParams.mockReturnValue(new URLSearchParams("view=logs"));
      const { unmount: u3 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "Borrowing Logs" })).toBeInTheDocument();
      u3();
    });

    it("dynamically adapts /attendance title based on user role and view query parameter", () => {
      // Student on /attendance -> "My Attendance"
      mockPathname.mockReturnValue("/attendance");
      mockPreferencesContext.role = "student";
      const { unmount: u1 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "My Attendance" })).toBeInTheDocument();
      u1();

      // Super Admin on /attendance -> "Attendance Logs"
      mockPreferencesContext.role = "super_admin";
      const { unmount: u2 } = render(<BreadcrumbNav />);
      expect(screen.getByRole("heading", { level: 1, name: "Attendance Logs" })).toBeInTheDocument();
      u2();
    });

    it("adversarially verifies mobile (<640px) responsiveness: back link is hidden sm:inline-flex to prevent narrow header overflow", () => {
      mockPathname.mockReturnValue("/student-catalog/b1a8d0b2-4d1e-450a-8d3e-908123456789");
      const { container } = render(<BreadcrumbNav />);
      
      const backLink = container.querySelector("a[href='/student-catalog']");
      expect(backLink).not.toBeNull();
      // Verifies hidden sm:inline-flex class suppressing link on mobile viewports (<640px)
      expect(backLink?.className).toContain("hidden");
      expect(backLink?.className).toContain("sm:inline-flex");
      // Verifies typography token text-xs instead of text-[10px]
      expect(backLink?.className).toContain("text-xs font-semibold uppercase tracking-wider text-muted-foreground");
    });

    it("verifies catalog parent back navigation reroutes cleanly to /inventory", () => {
      mockPathname.mockReturnValue("/catalog/b1a8d0b2-4d1e-450a-8d3e-908123456789");
      const { container } = render(<BreadcrumbNav />);
      
      const backLink = container.querySelector("a[href='/inventory']");
      expect(backLink).not.toBeNull();
      expect(backLink?.textContent).toContain("Inventory");
    });
  });

  // =========================================================================
  // Challenge 3: MainHeader Responsive Shell & Sidebar State Transitions
  // =========================================================================
  describe("Challenge 3: MainHeader Desktop Navigation Shell & Transitions", () => {
    it("hides header entirely on mobile viewports via hidden md:flex", () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector("header");
      expect(header).not.toBeNull();
      expect(header?.className).toContain("hidden md:flex");
      expect(header?.className).toContain("h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-background/95");
    });

    it("smoothly transitions branding logo container based on sidebar collapsed state", () => {
      // Expanded state: branding in MainHeader should be collapsed to max-w-0 pointer-events-none
      mockSidebarState = "expanded";
      const { container, rerender } = render(<MainHeader />);
      const logoWrapperExpanded = container.querySelector(".max-w-0.opacity-0.-translate-x-8.pointer-events-none");
      expect(logoWrapperExpanded).not.toBeNull();

      // Collapsed state: branding in MainHeader should expand into view
      mockSidebarState = "collapsed";
      rerender(<MainHeader />);
      const logoWrapperCollapsed = container.querySelector(".max-w-\\[240px\\].opacity-100.translate-x-0.mr-6");
      expect(logoWrapperCollapsed).not.toBeNull();
    });

    it("includes accessible aria-label on branding home link", () => {
      mockSidebarState = "collapsed";
      render(<MainHeader />);
      const brandLink = screen.getByRole("link", { name: /Lumina LMS Platform/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink.getAttribute("href")).toBe("/dashboard");
    });

    it("renders optional userNav with 1px border divider when supplied", () => {
      render(<MainHeader userNav={<div data-testid="custom-user-nav">CustomUserNav</div>} />);
      expect(screen.getByTestId("custom-user-nav")).toBeInTheDocument();
      const divider = screen.getByTestId("custom-user-nav").previousElementSibling;
      expect(divider?.className).toContain("h-8 w-[1px] bg-border/60 mx-1");
    });
  });

  // =========================================================================
  // Challenge 4: UserNav Avatar, Menu, and Logout Dialog
  // =========================================================================
  describe("Challenge 4: UserNav Primitives & Logout Flow", () => {
    const defaultUser = {
      email: "librarian@lumina.edu",
      user_metadata: {
        full_name: "Eleanor Vance",
      },
    };

    it("renders avatar button trigger with standardized rounded-lg token", () => {
      render(
        <UserNav
          user={defaultUser}
          profile={{ full_name: "Eleanor Vance", avatar_url: null }}
          role="librarian"
        />
      );

      const triggerBtn = screen.getByRole("button", { name: /User navigation menu/i });
      expect(triggerBtn).toBeInTheDocument();
      expect(triggerBtn.className).toContain("h-10 w-10 rounded-lg");
    });

    it("renders user initials in AvatarFallback when avatar_url is null", () => {
      mockPreferencesContext.profile = null;
      mockPreferencesContext.role = null;

      const { container } = render(
        <UserNav
          user={defaultUser}
          profile={{ full_name: "Eleanor Vance", avatar_url: null }}
          role="librarian"
        />
      );

      const fallback = container.querySelector(".bg-muted.font-bold.text-muted-foreground.rounded-lg");
      expect(fallback).not.toBeNull();
      expect(fallback?.textContent).toBe("EV");
    });

    it("renders role badge formatted with institutional tokens in dropdown menu", async () => {
      mockPreferencesContext.profile = null;
      mockPreferencesContext.role = null;

      render(
        <UserNav
          user={defaultUser}
          profile={{ full_name: "Eleanor Vance", avatar_url: null }}
          role="librarian"
        />
      );

      const triggerBtn = screen.getByRole("button", { name: /User navigation menu/i });
      fireEvent.keyDown(triggerBtn, { key: "Enter", code: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("librarian")).toBeInTheDocument();
      });

      const roleBadge = screen.getByText("librarian");
      expect(roleBadge.className).toContain("rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border/60");
    });

    it("displays logout action in dropdown with text-destructive and opens confirmation dialog", async () => {
      mockPreferencesContext.profile = null;
      mockPreferencesContext.role = null;

      render(
        <UserNav
          user={defaultUser}
          profile={{ full_name: "Eleanor Vance", avatar_url: null }}
          role="librarian"
        />
      );

      const triggerBtn = screen.getByRole("button", { name: /User navigation menu/i });
      fireEvent.keyDown(triggerBtn, { key: "Enter", code: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("Log out")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Log out").closest('[role="menuitem"]');
      expect(logoutItem?.className).toContain("text-destructive focus:text-destructive");

      fireEvent.click(logoutItem!);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 2, name: "Log out?" })).toBeInTheDocument();
        expect(screen.getByText("You will be signed out of your current session.")).toBeInTheDocument();
      });

      // Verify buttons inside logout dialog use rounded-lg
      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      const confirmLogoutBtn = screen.getByRole("button", { name: "Log out" });
      expect(cancelBtn.className).toContain("h-9 rounded-lg");
      expect(confirmLogoutBtn.className).toContain("h-9 rounded-lg");

      // Clicking logout calls logout hook
      fireEvent.click(confirmLogoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Challenge 5: ProtectedNav Role Matrix & Sidebar Layout
  // =========================================================================
  describe("Challenge 5: ProtectedNav Role Permissions & Responsive States", () => {
    it("renders only student-permitted navigation items for student role", () => {
      mockPreferencesContext.role = "student";
      mockPreferencesContext.profile = {
        id: "usr_student",
        full_name: "Student User",
        avatar_url: null,
        status: "ACTIVE",
        role: "student",
        permissions: {},
      };

      render(
        <SidebarProvider>
          <ProtectedNav />
        </SidebarProvider>
      );

      expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Catalog/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /My Borrowing/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /My Attendance/i })).toBeInTheDocument();

      // Privileged modules must be excluded
      expect(screen.queryByRole("link", { name: /Inventory/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Circulation Desk/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Analytics/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /User Directory/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Settings & Policies/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Audit Logs/i })).toBeNull();
    });

    it("grants Circulation Desk and Inventory to Student Assistant with manage_circulation permission", () => {
      mockPreferencesContext.role = "student_assistant";
      mockPreferencesContext.profile = {
        id: "usr_sa",
        full_name: "Assistant User",
        avatar_url: null,
        status: "ACTIVE",
        role: "student_assistant",
        permissions: {
          manage_circulation: true,
          view_admin_dashboard: true,
        },
      };

      render(
        <SidebarProvider>
          <ProtectedNav />
        </SidebarProvider>
      );

      expect(screen.getByRole("link", { name: /Circulation Desk/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Inventory/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /My Borrowing/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Borrowing Logs/i })).toBeInTheDocument();
    });

    it("renders full administrative suite except Audit Logs for librarian role", () => {
      mockPreferencesContext.role = "librarian";
      mockPreferencesContext.profile = {
        id: "usr_lib",
        full_name: "Librarian User",
        avatar_url: null,
        status: "ACTIVE",
        role: "librarian",
        permissions: {},
      };

      render(
        <SidebarProvider>
          <ProtectedNav />
        </SidebarProvider>
      );

      expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Inventory/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Circulation Desk/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Borrowing Logs/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /User Directory/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Attendance Logs/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Settings & Policies/i })).toBeInTheDocument();

      // Student catalog and Audit logs must be hidden for librarian
      expect(screen.queryByRole("link", { name: /^Catalog$/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Audit Logs/i })).toBeNull();
    });

    it("renders Audit Logs exclusively for super_admin role", () => {
      mockPreferencesContext.role = "super_admin";
      mockPreferencesContext.profile = {
        id: "usr_admin",
        full_name: "Admin User",
        avatar_url: null,
        status: "ACTIVE",
        role: "super_admin",
        permissions: {},
      };

      render(
        <SidebarProvider>
          <ProtectedNav />
        </SidebarProvider>
      );

      expect(screen.getByRole("link", { name: /Audit Logs/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 6: Authenticated Layout Shell Responsive Bounds (<640px and >1440px)
  // =========================================================================
  describe("Challenge 6: Authenticated Layout Shell Responsive Bounds Analysis", () => {
    it("confirms app/(authenticated)/layout.tsx defines distinct mobile (<768px) and desktop headers", () => {
      const layoutFile = path.join(repoRoot, "app", "(authenticated)", "layout.tsx");
      const content = fs.readFileSync(layoutFile, "utf-8");

      // Mobile header must have md:hidden, h-[52px], border-b border-border/60, and sticky top-0
      expect(content).toContain("md:hidden sticky top-0 z-40 flex w-full h-[52px] shrink-0 items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-md px-3.5 shadow-sm");
      
      // Desktop header must have MainHeader with hidden md:block fallback
      expect(content).toContain("<MainHeader />");
      expect(content).toContain("hidden md:block");
    });

    it("confirms mobile header contains SidebarTrigger and truncate breadcrumb wrapper to avoid mobile layout clipping", () => {
      const layoutFile = path.join(repoRoot, "app", "(authenticated)", "layout.tsx");
      const content = fs.readFileSync(layoutFile, "utf-8");

      expect(content).toContain('<SidebarTrigger className="shrink-0" />');
      expect(content).toContain('<div className="truncate text-sm font-semibold tracking-tight">');
      expect(content).toContain('<div className="ml-2 shrink-0 flex items-center gap-2">');
    });

    it("adversarially verifies wide viewport (>1440px) containment: max-w-[1450px] and mx-auto cap horizontal stretching", () => {
      const layoutFile = path.join(repoRoot, "app", "(authenticated)", "layout.tsx");
      const content = fs.readFileSync(layoutFile, "utf-8");

      // Layout shell container MUST have max-w-[1450px] and mx-auto
      expect(content).toContain("mx-auto mt-4 w-full max-w-[1450px] p-4 md:mt-0 md:pt-2 md:px-6 md:pb-6");
    });
  });
});
