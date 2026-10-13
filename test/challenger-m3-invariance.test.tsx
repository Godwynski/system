import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

// Component imports for runtime rendering verification
import { CirculationStepper } from "@/components/circulation/CirculationStepper";
import { ReviewStep } from "@/components/circulation/steps/ReviewStep";
import { SuccessStep } from "@/components/circulation/steps/SuccessStep";
import { ISBNLookupBar } from "@/components/catalog/add/ISBNLookupBar";
import { BookDetailsForm } from "@/components/catalog/add/BookDetailsForm";

const M3_FILES = [
  "components/circulation/CirculationWizard.tsx",
  "components/circulation/CirculationStepper.tsx",
  "components/circulation/steps/ScanStep.tsx",
  "components/circulation/steps/ReviewStep.tsx",
  "components/circulation/steps/SuccessStep.tsx",
  "components/inventory/ModernInventoryClient.tsx",
  "app/(authenticated)/inventory/add/AddBookClient.tsx",
  "components/catalog/AdminManagementContent.tsx",
  "components/catalog/BookDetailModal.tsx",
  "components/catalog/add/BookDetailsForm.tsx",
  "components/catalog/add/ISBNLookupBar.tsx",
  "app/(authenticated)/student-catalog/StudentCatalogClient.tsx",
  "app/(authenticated)/student-catalog/[id]/StudentBookDetailClient.tsx",
];

describe("Adversarial Invariant Verification Suite — Milestone 3 (Operational Surfaces)", () => {
  // =========================================================================
  // 1. Scope Inventory Integrity & File Resolution
  // =========================================================================
  describe("1. Scope Inventory Integrity & File Existence", () => {
    it.each(M3_FILES)("verifies file %s exists on disk and is readable", (relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. Radius Invariants Oracle (DESIGN.md: 8px controls, 12px containers)
  // =========================================================================
  describe("2. Radius Invariants (Zero rounded-2xl / rounded-3xl / non-token radii)", () => {
    it("enforces zero instances of rounded-2xl or rounded-3xl across all 13 harmonized files", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
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

    it("enforces zero instances of rounded-md (6px off-ramp) in badge/pill controls across M3 files", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("rounded-md") && !relPath.includes("components/ui/")) {
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
  // 3. Type Ramp & Typography Invariants (DESIGN.md: strict 5-tier type ramp)
  // =========================================================================
  describe("3. Typography & Type Ramp Invariants", () => {
    it("enforces zero arbitrary pixel font sizes across all 13 harmonized files", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/text-\[\d+px\]/);
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

    it("verifies numeric/ledger identifiers strictly use tabular-nums in operational surfaces", () => {
      const requiredTabularFiles = [
        "components/circulation/CirculationWizard.tsx",
        "components/circulation/steps/ReviewStep.tsx",
        "components/catalog/add/ISBNLookupBar.tsx",
        "components/catalog/AdminManagementContent.tsx",
        "app/(authenticated)/student-catalog/[id]/StudentBookDetailClient.tsx",
      ];

      for (const relPath of requiredTabularFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).toContain("tabular-nums");
      }
    });

    it("enforces standard institutional typography instead of off-ramp text-2xs", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("text-2xs")) {
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
  // 4. Crisp Boundary & Border Invariants (DESIGN.md: 1px hairline border)
  // =========================================================================
  describe("4. Crisp Boundary & Border Invariants", () => {
    it("enforces standard border tokens and rejects faint non-token borders (border-border/10, border-border/20)", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          const match = line.match(/\bborder-border\/(10|20)\b/);
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

    it("rejects heavy ambient blur (backdrop-blur-2xl) on primary sticky headers", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("backdrop-blur-2xl") || line.includes("backdrop-blur-xl")) {
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

    it("rejects heavy glowing decorative box-shadows in student catalog surfaces", () => {
      const violations: { file: string; line: number; match: string }[] = [];

      for (const relPath of M3_FILES) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

        lines.forEach((line, idx) => {
          if (line.includes("shadow-[0_0_") || line.includes("rgba(16,185,129,")) {
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
  // 5. Semantic Status Color Invariants (DESIGN.md: The Status Purpose Rule)
  // =========================================================================
  describe("5. Semantic Status Color Invariants", () => {
    it("enforces institutional .status-* tokens and rejects ad-hoc status color classes in BookDetailModal", () => {
      const relPath = "components/catalog/BookDetailModal.tsx";
      const fullPath = path.resolve(process.cwd(), relPath);
      const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

      const violations: { file: string; line: number; match: string }[] = [];

      lines.forEach((line, idx) => {
        if (line.includes("border-amber-500/10") || line.includes("bg-amber-500/5")) {
          violations.push({
            file: relPath,
            line: idx + 1,
            match: line.trim(),
          });
        }
        if (line.includes("bg-emerald-500/90") || line.includes("bg-amber-500/90")) {
          violations.push({
            file: relPath,
            line: idx + 1,
            match: line.trim(),
          });
        }
      });

      expect(violations).toEqual([]);
    });

    it("enforces institutional .status-* tokens in AdminManagementContent status configuration", () => {
      const relPath = "components/catalog/AdminManagementContent.tsx";
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");

      // STATUS_CONFIG must not use hardcoded non-token colored backgrounds/borders
      expect(content).not.toContain("border-emerald-500/10");
      expect(content).not.toContain("border-amber-500/10");
      expect(content).not.toContain("border-rose-500/10");
      expect(content).not.toContain("border-indigo-500/10");
    });

    it("enforces monochromatic neutral utility icons on export buttons in ModernInventoryClient", () => {
      const relPath = "components/inventory/ModernInventoryClient.tsx";
      const fullPath = path.resolve(process.cwd(), relPath);
      const lines = fs.readFileSync(fullPath, "utf-8").split("\n");

      const violations: { file: string; line: number; match: string }[] = [];

      lines.forEach((line, idx) => {
        // Export button icons should be monochromatic neutrals, not rainbow colored
        if (
          (line.includes("FileSpreadsheet") && line.includes("text-emerald-500")) ||
          (line.includes("FileCode") && (line.includes("text-blue-500") || line.includes("text-amber-500"))) ||
          (line.includes("ImageIcon") && line.includes("text-indigo-500"))
        ) {
          violations.push({
            file: relPath,
            line: idx + 1,
            match: line.trim(),
          });
        }
      });

      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // 6. Runtime Rendering & Structural Invariant Verification
  // =========================================================================
  describe("6. Runtime Rendering & Structural Verification", () => {
    it("CirculationStepper renders indicators with standard borders and typography", () => {
      const steps = [
        { id: 1, label: "Step One" },
        { id: 2, label: "Step Two" },
        { id: 3, label: "Step Three" },
      ];

      const { container } = render(<CirculationStepper steps={steps} currentStep={2} />);
      
      // Step labels must use text-xs font-semibold uppercase tracking-wider
      const labels = container.querySelectorAll("span.text-xs.font-semibold.uppercase.tracking-wider");
      expect(labels.length).toBe(3);

      // Background connection line must use bg-border/60
      const line = container.querySelector(".bg-border\\/60");
      expect(line).not.toBeNull();

      // Zero prohibited radii
      container.querySelectorAll("*").forEach((el) => {
        expect(el.className).not.toContain("rounded-2xl");
        expect(el.className).not.toContain("rounded-3xl");
      });
    });

    it("ReviewStep renders checkout review with rounded-xl containers, rounded-lg ID box and tabular-nums", () => {
      const { container } = render(
        <ReviewStep
          type="checkout"
          studentName="Alex Morgan"
          studentId="STU-2026-908"
          bookTitle="Clean Architecture: A Craftsman's Guide"
          dueDate="2026-11-01"
        />
      );

      // Card containers must use rounded-xl border border-border/60 bg-card/40
      const cards = container.querySelectorAll(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(cards.length).toBe(2);

      // ID box must use rounded-lg
      const idBox = container.querySelector(".rounded-lg.p-4.border.border-border\\/60");
      expect(idBox).not.toBeNull();

      // Student ID must have tabular-nums
      expect(screen.getByText("STU-2026-908")).toHaveClass("tabular-nums");
      expect(screen.getByText("2026-11-01")).toHaveClass("tabular-nums");
    });

    it("ReviewStep renders return review with borrowed date and status-success icon", () => {
      const { container } = render(
        <ReviewStep
          type="return"
          studentName="Maria Santos"
          studentId="STU-2026-441"
          bookTitle="Refactoring: Improving the Design of Existing Code"
          dueDate="2026-10-15"
          borrowedAt="2026-10-01"
        />
      );

      expect(screen.getByText("Review Return")).toBeInTheDocument();
      expect(screen.getByText("2026-10-01")).toHaveClass("tabular-nums");
      
      const successIcon = container.querySelector(".status-success");
      expect(successIcon).not.toBeNull();
    });

    it("SuccessStep renders with status-success icon, rounded-xl hold card, and rounded-lg action", () => {
      const onReset = vi.fn();
      const { container } = render(
        <SuccessStep
          title="Return Complete"
          message="Resource returned to circulation."
          onReset={onReset}
          reservationReady={true}
          reservedFor="Jordan Lee"
        />
      );

      expect(screen.getByText("Return Complete")).toBeInTheDocument();
      expect(screen.getByText("Jordan Lee")).toBeInTheDocument();

      // Hold notification card must be rounded-xl border border-border/60 bg-card/40
      const holdCard = container.querySelector(".rounded-xl.p-4.bg-card\\/40.border.border-border\\/60");
      expect(holdCard).not.toBeNull();

      // Action button must have rounded-lg
      const btn = screen.getByRole("button", { name: /Process Another/i });
      expect(btn).toHaveClass("rounded-lg");
      expect(btn.className).not.toContain("rounded-2xl");

      fireEvent.click(btn);
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("ISBNLookupBar renders with rounded-xl shell, rounded-lg controls and tabular-nums input", () => {
      const onFetch = vi.fn();
      const onChange = vi.fn();

      const { container } = render(
        <ISBNLookupBar
          isbn="9780132350884"
          onIsbnChange={onChange}
          onFetchData={onFetch}
          isbnLoading={false}
        />
      );

      // Shell container
      const shell = container.querySelector(".rounded-xl.border.border-border\\/60.bg-card\\/40");
      expect(shell).not.toBeNull();

      // Input must have rounded-lg and tabular-nums
      const input = screen.getByPlaceholderText("Enter ISBN-10 or ISBN-13");
      expect(input).toHaveClass("rounded-lg");
      expect(input).toHaveClass("tabular-nums");

      // Button must have rounded-lg
      const btn = screen.getByRole("button", { name: "Fetch Data" });
      expect(btn).toHaveClass("rounded-lg");

      fireEvent.click(btn);
      expect(onFetch).toHaveBeenCalledTimes(1);
    });

    it("BookDetailsForm renders form fields with rounded-lg inputs and section headers", () => {
      const onUpdate = vi.fn();
      const categories = [
        { id: "cat-1", name: "Computer Science" },
        { id: "cat-2", name: "Mathematics" },
      ];

      const formData = {
        title: "Clean Code",
        author: "Robert C. Martin",
        categoryId: "cat-1",
        section: "Main Stacks",
        location: "Floor 2",
        copies: 3,
        tags: "programming, software",
        dewey_decimal: "005.1",
        isbn: "9780132350884",
      };

      const { container } = render(
        <BookDetailsForm
          formData={formData}
          onUpdate={onUpdate}
          categories={categories}
        />
      );

      // Section header icon boxes must be rounded-lg
      const sectionIcons = container.querySelectorAll(".h-6.w-6.rounded-lg.bg-primary\\/10");
      expect(sectionIcons.length).toBeGreaterThanOrEqual(1);

      // Inputs must be rounded-lg
      const titleInput = screen.getByPlaceholderText("e.g. Clean Code");
      expect(titleInput).toHaveClass("rounded-lg");
      expect(titleInput).not.toHaveClass("rounded-2xl");

      // Verify no prohibited radii in rendered form
      container.querySelectorAll("*").forEach((el) => {
        expect(el.className).not.toContain("rounded-2xl");
        expect(el.className).not.toContain("rounded-3xl");
      });
    });
  });
});
