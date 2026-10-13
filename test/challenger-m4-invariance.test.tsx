import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

// Components for runtime rendering and invariance checks
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { CategoryItem } from "@/components/admin/categories/CategoryItem";

const M4_FILES = [
  // Feature 14: Attendance & Kiosk
  "app/(authenticated)/attendance/page.tsx",
  "app/(authenticated)/attendance/AttendanceClient.tsx",
  "components/common/QRScanner.tsx",

  // Feature 15: Users & Directory
  "app/(authenticated)/users/page.tsx",
  "app/(authenticated)/users/UsersContent.tsx",
  "app/(authenticated)/users/new/page.tsx",
  "app/(authenticated)/users/new/NewUserClient.tsx",
  "app/(authenticated)/users/[id]/page.tsx",
  "app/(authenticated)/users/[id]/UserDetailClient.tsx",

  // Feature 16: History & Overdue Ledger
  "app/(authenticated)/history/page.tsx",
  "app/(authenticated)/history/HistoryContent.tsx",

  // Feature 17: Audit Log Harmonization
  "app/(authenticated)/audit/page.tsx",
  "components/admin/AuditLogClient.tsx",
  "components/admin/AuditLogExportImportModal.tsx",

  // Feature 18: Policies & Category Management Harmonization
  "app/(authenticated)/policies/page.tsx",
  "components/admin/categories/CategoryDialog.tsx",
  "components/admin/categories/CategoryItem.tsx",
  "components/admin/CategoryManagement.tsx",
  "components/admin/policies/PolicyLayout.tsx",
  "components/admin/policies/PolicyField.tsx",
  "components/admin/PolicyCommitModal.tsx",
  "components/admin/PolicySimulationPanel.tsx",
  "components/admin/policies/IdentityListManager.tsx",
  "components/admin/policies/SupportFAQManager.tsx",
  "components/admin/system-announcement.tsx",
  "components/settings/sections/PoliciesSection.tsx",

  // Feature 19: Auth Onboarding Fix
  "components/auth/OnboardingForm.tsx",
  "components/auth/AccountPendingScreen.tsx",
];

const GOVERNANCE_CATEGORY_POLICY_FILES = [
  "components/admin/categories/CategoryDialog.tsx",
  "components/admin/categories/CategoryItem.tsx",
  "components/admin/CategoryManagement.tsx",
  "components/admin/policies/PolicyLayout.tsx",
  "components/admin/policies/PolicyField.tsx",
  "components/admin/PolicyCommitModal.tsx",
  "components/admin/PolicySimulationPanel.tsx",
  "components/admin/policies/IdentityListManager.tsx",
  "components/admin/policies/SupportFAQManager.tsx",
  "components/admin/system-announcement.tsx",
];

const INTERACTIVE_ACTION_FILES = [
  "app/(authenticated)/history/HistoryContent.tsx",
  "components/admin/AuditLogClient.tsx",
  "components/admin/AuditLogExportImportModal.tsx",
  "components/admin/CategoryManagement.tsx",
  "components/admin/categories/CategoryDialog.tsx",
  "components/admin/categories/CategoryItem.tsx",
  "components/admin/policies/PolicyLayout.tsx",
  "components/admin/policies/PolicyField.tsx",
  "components/admin/PolicyCommitModal.tsx",
  "components/admin/system-announcement.tsx",
];

describe("Adversarial Invariant Verification Suite — Milestone 4 (Governance & Identity)", () => {
  // =========================================================================
  // 1. File Resolution and Scope Integrity
  // =========================================================================
  describe("1. Scope Inventory Integrity & File Resolution", () => {
    it.each(M4_FILES)("verifies file %s exists on disk and is non-empty", (relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. Animate-Bounce Invariance Oracle
  // =========================================================================
  describe("2. Motion Invariance: Zero animate-bounce across all M4 surfaces", () => {
    it("enforces zero occurrences of animate-bounce in Attendance or any other M4 component", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M4_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("animate-bounce")) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it("enforces zero occurrences of animate-bounce-subtle in OnboardingForm or any M4 component", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M4_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("animate-bounce-subtle")) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // 3. Radius Invariants: Extreme arbitrary radii purge
  // =========================================================================
  describe("3. Radius Invariants: Zero rounded-[3rem], rounded-[2rem], rounded-[1.5rem]", () => {
    it("enforces zero occurrences of rounded-[3rem], rounded-[2rem], or rounded-[1.5rem] in Category/Policies/FAQ/Identity/Announcements", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of GOVERNANCE_CATEGORY_POLICY_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/\brounded-\[\s*(?:3rem|2rem|1\.5rem|50px)\s*\]/);
          if (match) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it("enforces zero instances of rounded-2xl or rounded-3xl across all 28 M4 files", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M4_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/\brounded-(2xl|3xl)\b/);
          if (match) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Scale Transform Invariants in Interactive Controls
  // =========================================================================
  describe("4. Transform Invariants: Zero scale-105, scale-110, or hover:scale- in buttons/switches", () => {
    it("enforces zero occurrences of scale-105, scale-110, or hover:scale- in History, Audit, Policies, or Categories", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of INTERACTIVE_ACTION_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/\b(hover:scale-[\w\[\].]+|scale-105|scale-110)\b/);
          if (match) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it("verifies PolicyField switch control has no scale-110 enlargement", () => {
      const fullPath = path.resolve(process.cwd(), "components/admin/policies/PolicyField.tsx");
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content).not.toContain("scale-110");
    });
  });

  // =========================================================================
  // 5. Glow Shadow Invariants
  // =========================================================================
  describe("5. Elevation & Shadow Invariants: Zero decorative glow shadows", () => {
    it("enforces zero occurrences of decorative glow shadows (shadow-[0_0_20px_...], shadow-[0_0_8px_...]) in Category, FAQ, and Policy commit modal", () => {
      const targetFiles = [
        "components/admin/categories/CategoryItem.tsx",
        "components/admin/categories/CategoryDialog.tsx",
        "components/admin/CategoryManagement.tsx",
        "components/admin/policies/SupportFAQManager.tsx",
        "components/admin/PolicyCommitModal.tsx",
        "components/admin/policies/PolicyLayout.tsx",
      ];

      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (
            line.includes("shadow-[0_0_") || 
            line.includes("rgba(16,185,129,") || 
            line.includes("shadow-2xl")
          ) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it("enforces zero decorative top gradient bars in dialogs across Category, FAQ, and Policies", () => {
      const targetFiles = [
        "components/admin/categories/CategoryDialog.tsx",
        "components/admin/policies/SupportFAQManager.tsx",
        "components/admin/PolicyCommitModal.tsx",
      ];

      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("bg-gradient-to-r") || line.includes("bg-gradient-to-l")) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // 6. Typography Ramp Invariants: Zero arbitrary pixel font off-ramps
  // =========================================================================
  describe("6. Typography Invariants: Zero arbitrary pixel font off-ramps", () => {
    it("enforces zero arbitrary pixel font sizes across all 28 M4 modified files", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M4_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/\btext-\[\s*\d+px\s*\]/);
          if (match) {
            violations.push({
              file: relPath,
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it("specifically verifies zero instances of text-[7px], text-[8px], text-[9px], text-[10px], or text-[11px]", () => {
      const targetPatterns = ["text-[7px]", "text-[8px]", "text-[9px]", "text-[10px]", "text-[11px]"];
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M4_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          for (const pattern of targetPatterns) {
            if (line.includes(pattern)) {
              violations.push({
                file: relPath,
                line: idx + 1,
                match: line.trim(),
              });
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // 7. Standard Radii Tokens: Controls rounded-lg, Containers rounded-xl
  // =========================================================================
  describe("7. Standard Radii Discipline: Controls rounded-lg, Containers rounded-xl", () => {
    it("verifies containers across M4 enforce canonical rounded-xl and 1px hairline borders", () => {
      const containerFiles = [
        "components/admin/categories/CategoryDialog.tsx",
        "components/admin/categories/CategoryItem.tsx",
        "components/admin/PolicyCommitModal.tsx",
        "components/admin/policies/IdentityListManager.tsx",
        "components/admin/policies/SupportFAQManager.tsx",
        "components/admin/AuditLogExportImportModal.tsx",
        "components/auth/OnboardingForm.tsx",
        "components/auth/AccountPendingScreen.tsx",
      ];

      for (const relPath of containerFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).toContain("rounded-xl");
        expect(content).toMatch(/border-border(\/60)?/);
      }
    });

    it("verifies interactive controls across M4 enforce canonical rounded-lg", () => {
      const controlFiles = [
        "components/common/QRScanner.tsx",
        "components/admin/categories/CategoryDialog.tsx",
        "components/admin/CategoryManagement.tsx",
        "components/admin/policies/IdentityListManager.tsx",
        "components/admin/policies/SupportFAQManager.tsx",
        "components/admin/system-announcement.tsx",
        "components/auth/OnboardingForm.tsx",
        "components/auth/AccountPendingScreen.tsx",
      ];

      for (const relPath of controlFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).toContain("rounded-lg");
      }
    });
  });

  // =========================================================================
  // 8. Numeric & Tabular Alignment Invariants
  // =========================================================================
  describe("8. Numeric & Tabular Alignment Invariants", () => {
    it("verifies numeric identifiers, timestamps, and metrics strictly use tabular-nums in M4 surfaces", () => {
      const requiredTabularFiles = [
        "app/(authenticated)/users/UsersContent.tsx",
        "app/(authenticated)/users/[id]/UserDetailClient.tsx",
        "app/(authenticated)/history/HistoryContent.tsx",
        "components/admin/AuditLogClient.tsx",
        "components/admin/AuditLogExportImportModal.tsx",
        "components/admin/policies/PolicyField.tsx",
        "components/admin/policies/IdentityListManager.tsx",
        "components/admin/policies/SupportFAQManager.tsx",
        "components/auth/OnboardingForm.tsx",
      ];

      for (const relPath of requiredTabularFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).toContain("tabular-nums");
      }
    });
  });

  // =========================================================================
  // 9. Semantic Status Color Tokens (The Status Purpose Rule)
  // =========================================================================
  describe("9. Semantic Status Color Tokens Invariance", () => {
    it("verifies AttendanceClient strictly uses semantic status tokens without ad-hoc hex or rgb", () => {
      const fullPath = path.resolve(process.cwd(), "app/(authenticated)/attendance/AttendanceClient.tsx");
      const content = fs.readFileSync(fullPath, "utf-8");

      expect(content).toContain("status-success");
      expect(content).toContain("status-warning");
      expect(content).not.toContain("text-emerald-500");
      expect(content).not.toContain("text-amber-500");
      expect(content).not.toContain("text-sky-500");
    });

    it("verifies AuditLogClient strictly uses semantic status tokens for badge events", () => {
      const fullPath = path.resolve(process.cwd(), "components/admin/AuditLogClient.tsx");
      const content = fs.readFileSync(fullPath, "utf-8");

      expect(content).toContain("status-success");
      expect(content).toContain("status-warning");
      expect(content).toContain("status-danger");
      expect(content).toContain("status-neutral");
      expect(content).not.toContain("rgba(16,185,129");
      expect(content).not.toContain("rgba(239,68,68");
    });
  });

  // =========================================================================
  // 10. Runtime Component Rendering Invariants
  // =========================================================================
  describe("10. Runtime Component Rendering & DOM Verification", () => {
    it("renders CategoryItem adhering strictly to rounded-xl container and rounded-lg control", () => {
      const mockCategory = {
        id: "cat-1",
        name: "Computer Science",
        slug: "computer-science",
        description: "Computing, algorithms, and software engineering",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { container } = render(
        <CategoryItem
          category={mockCategory}
          isBulkEditing={false}
          isChanged={false}
          onEdit={() => {}}
          onArchive={() => {}}
        />
      );

      const root = container.firstChild as HTMLElement;
      expect(root).toBeInTheDocument();
      expect(root.className).toContain("rounded-xl");
      expect(root.className).toContain("border-border/60");
      expect(root.className).not.toContain("rounded-[2rem]");
      expect(root.className).not.toContain("shadow-[0_0_20px");

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.className).toContain("rounded-lg");
        expect(btn.className).not.toContain("rounded-xl");
      });
    });

    it("renders CategoryItem in bulk editing mode with rounded-lg inputs", () => {
      const mockCategory = {
        id: "cat-1",
        name: "Physics",
        slug: "physics",
        description: "Classical and modern physics",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { container } = render(
        <CategoryItem
          category={mockCategory}
          draftCategory={mockCategory}
          isBulkEditing={true}
          isChanged={true}
          onDraftChange={() => {}}
        />
      );

      const inputs = container.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThan(0);
      inputs.forEach((input) => {
        expect(input.className).toContain("rounded-lg");
        expect(input.className).toContain("border-border/60");
        expect(input.className).not.toContain("rounded-2xl");
      });
    });

    it("renders AdminTableShell with standard 12px rounded-xl container and 1px hairline border", () => {
      const { container } = render(
        <AdminTableShell
          title="Milestone 4 Governance Shell"
          controls={<button className="rounded-lg">Test Control</button>}
        >
          <div>Shell Content</div>
        </AdminTableShell>
      );

      const card = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(card).not.toBeNull();
    });

    it("verifies StatusBadge correctly styles all Milestone 4 user directory statuses", () => {
      const statuses = [
        { input: "ACTIVE", expected: "status-warning" },
        { input: "active", expected: "status-success" },
        { input: "PENDING", expected: "status-warning" },
        { input: "pending", expected: "status-warning" },
        { input: "SUSPENDED", expected: "status-danger" },
        { input: "suspended", expected: "status-danger" },
        { input: "ARCHIVED", expected: "status-neutral" },
        { input: "archived", expected: "status-neutral" },
      ];

      for (const { input, expected } of statuses) {
        const { container } = render(<StatusBadge status={input} />);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain(expected);
        expect(badge.className).toContain("rounded-lg");
        expect(badge.className).not.toContain("rounded-2xl");
      }
    });

    it("verifies RoleBadge enforces neutral token classes for all Milestone 4 directory roles", () => {
      const roles = ["super_admin", "librarian", "student_assistant", "student"];
      for (const role of roles) {
        const { container } = render(<RoleBadge role={role} />);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain("rounded-lg");
        expect(badge.className).toContain("border-border/60");
        expect(badge.className).toContain("bg-muted");
        expect(badge.className).not.toContain("text-blue-");
        expect(badge.className).not.toContain("text-indigo-");
      }
    });

    it("verifies M4 route skeletons maintain crisp hairline borders and zero non-token radiuses", () => {
      const skeletons = [
        { path: "app/(authenticated)/attendance/page.tsx", name: "AttendanceSkeleton" },
        { path: "app/(authenticated)/users/new/page.tsx", name: "NewUserSkeleton" },
        { path: "app/(authenticated)/users/[id]/page.tsx", name: "UserDetailSkeleton" },
        { path: "app/(authenticated)/policies/page.tsx", name: "PoliciesSkeleton" },
        { path: "app/(authenticated)/audit/page.tsx", name: "AuditSkeleton" },
        { path: "app/(authenticated)/history/HistoryContent.tsx", name: "HistorySkeleton" },
      ];

      for (const { path: relPath, name } of skeletons) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, "utf-8");

        expect(content).toContain(name);
        expect(content).toContain("rounded-xl");
        expect(content).toMatch(/border-border(\/60)?/);
        expect(content).not.toContain("rounded-2xl");
        expect(content).not.toContain("rounded-3xl");
      }
    });
  });
});

