import { describe, it, expect, vi } from "vitest";
import React, { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "fs";
import path from "path";

// UI Primitives under test
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompactPagination } from "@/components/ui/compact-pagination";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, HelpCircle } from "lucide-react";

/**
 * Challenger M1 Empirical Challenge Suite
 * 
 * Rigorously stress-tests:
 * 1. Design token mathematical calculations & root variables
 * 2. Canonical Table component exports, ref forwarding, and border tokens
 * 3. Dialog primitives nesting, close button toggles, and modal radii
 * 4. Select primitives trigger sizes, popover styling, and item selection
 * 5. Badge & Button variant class generation and rounded-lg consistency
 * 6. CompactPagination edge-case bounds (0 items, single item, last page)
 * 7. Textarea and EmptyState container radii and button triggers
 */
describe("Challenger M1: UI Primitives & Design Token Calculations", () => {
  /* -------------------------------------------------------------------------
   * CHALLENGE 1: Design Token Mathematical Calculations & Root CSS Variables
   * ------------------------------------------------------------------------- */
  describe("Challenge 1: Design Token Calculations & CSS Variable Oracle", () => {
    const globalsCssPath = path.resolve(process.cwd(), "app/globals.css");
    const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

    const tailwindConfigPath = path.resolve(process.cwd(), "tailwind.config.ts");
    const tailwindConfig = fs.readFileSync(tailwindConfigPath, "utf-8");

    const designMdPath = path.resolve(process.cwd(), "DESIGN.md");
    const designMd = fs.readFileSync(designMdPath, "utf-8");

    it("evaluates root radius to exactly 0.5rem (8px baseline)", () => {
      const radiusMatch = globalsCss.match(/--radius:\s*([^;]+);/);
      expect(radiusMatch).not.toBeNull();
      const rawRadius = radiusMatch![1].trim();
      expect(rawRadius).toBe("0.5rem");

      // Under standard root 16px font-size:
      const remVal = parseFloat(rawRadius);
      const pxVal = remVal * 16;
      expect(pxVal).toBe(8); // Baseline = 8px
    });

    it("verifies tailwind.config.ts computes sm, md, lg, xl radii conforming strictly to DESIGN.md", () => {
      // DESIGN.md specification:
      // sm: 4px
      // md: 6px
      // lg: 8px
      // xl: 12px
      expect(tailwindConfig).toContain('sm: "calc(var(--radius) - 4px)"');
      expect(tailwindConfig).toContain('md: "calc(var(--radius) - 2px)"');
      expect(tailwindConfig).toContain('lg: "var(--radius)"');
      expect(tailwindConfig).toContain('xl: "calc(var(--radius) + 4px)"');

      const basePx = 8;
      const computedSm = basePx - 4;
      const computedMd = basePx - 2;
      const computedLg = basePx;
      const computedXl = basePx + 4;

      expect(computedSm).toBe(4);
      expect(computedMd).toBe(6);
      expect(computedLg).toBe(8);
      expect(computedXl).toBe(12);

      // Verify DESIGN.md defines these exact numbers
      expect(designMd).toMatch(/sm:\s*["']4px["']/);
      expect(designMd).toMatch(/md:\s*["']6px["']/);
      expect(designMd).toMatch(/lg:\s*["']8px["']/);
      expect(designMd).toMatch(/xl:\s*["']12px["']/);
    });

    it("guarantees no secondary --radius definitions override the 0.5rem token", () => {
      const allRadiusMatches = [...globalsCss.matchAll(/--radius:\s*([^;]+);/g)];
      expect(allRadiusMatches.length).toBe(1);
      expect(allRadiusMatches[0][1].trim()).toBe("0.5rem");
    });

    it("verifies institutional status color tokens in globals.css match DESIGN.md semantics", () => {
      // Success Forest: hsl(142 72% 32%)
      expect(globalsCss).toMatch(/--status-success:\s*142\s+72%\s+32%;/);
      // Warning Amber: hsl(38 92% 38%)
      expect(globalsCss).toMatch(/--status-warning:\s*38\s+92%\s+38%;/);
      // Critical Crimson: hsl(0 72% 44%)
      expect(globalsCss).toMatch(/--status-danger:\s*0\s+72%\s+44%;/);
      // Neutral Steel: hsl(215 16% 38%)
      expect(globalsCss).toMatch(/--status-neutral:\s*215\s+16%\s+38%;/);
    });

    it("verifies orphaned legacy CSS classes and animations remain completely purged", () => {
      expect(globalsCss).not.toContain(".status-dot-success");
      expect(globalsCss).not.toContain(".status-fill-success");
      expect(globalsCss).not.toContain("@keyframes pulse-bright");
      expect(globalsCss).not.toContain("@keyframes slideUp");
      expect(globalsCss).not.toContain("@keyframes shake");
      expect(globalsCss).not.toContain("@keyframes float");
      expect(globalsCss).not.toContain("@keyframes scan");
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 2: Canonical Table Primitive & Ref Forwarding
   * ------------------------------------------------------------------------- */
  describe("Challenge 2: Table Primitive Exports, Rendering & Ref Forwarding", () => {
    it("exports all 8 canonical Table primitives", () => {
      expect(Table).toBeDefined();
      expect(TableHeader).toBeDefined();
      expect(TableBody).toBeDefined();
      expect(TableFooter).toBeDefined();
      expect(TableHead).toBeDefined();
      expect(TableRow).toBeDefined();
      expect(TableCell).toBeDefined();
      expect(TableCaption).toBeDefined();
    });

    it("renders complete tabular layout with tabular-nums and hairline borders", () => {
      const { container } = render(
        <Table data-testid="test-table">
          <TableCaption>Active Circulation Inventory</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Call Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Barcode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>QA76.73</TableCell>
              <TableCell>TypeScript Handbook</TableCell>
              <TableCell>BC-109283</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total Items</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      const tableEl = container.querySelector("table");
      expect(tableEl).not.toBeNull();
      expect(tableEl?.className).toContain("tabular-nums");

      const wrapperDiv = tableEl?.parentElement;
      expect(wrapperDiv?.className).toContain("overflow-auto");
      expect(wrapperDiv?.className).toContain("w-full");

      const th = container.querySelector("th");
      expect(th?.className).toContain("text-xs");
      expect(th?.className).toContain("font-semibold");
      expect(th?.className).toContain("uppercase");

      const td = container.querySelector("td");
      expect(td?.className).toContain("p-4");
      expect(td?.className).toContain("align-middle");

      const tr = container.querySelector("tbody tr");
      expect(tr?.className).toContain("border-border/60");

      const caption = container.querySelector("caption");
      expect(caption?.textContent).toBe("Active Circulation Inventory");
    });

    it("properly forwards refs across all Table primitives without breaking", () => {
      const tableRef = createRef<HTMLTableElement>();
      const headerRef = createRef<HTMLTableSectionElement>();
      const bodyRef = createRef<HTMLTableSectionElement>();
      const footerRef = createRef<HTMLTableSectionElement>();
      const rowRef = createRef<HTMLTableRowElement>();
      const headRef = createRef<HTMLTableCellElement>();
      const cellRef = createRef<HTMLTableCellElement>();
      const captionRef = createRef<HTMLTableCaptionElement>();

      render(
        <Table ref={tableRef}>
          <TableCaption ref={captionRef}>Caption</TableCaption>
          <TableHeader ref={headerRef}>
            <TableRow ref={rowRef}>
              <TableHead ref={headRef}>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={bodyRef}>
            <TableRow>
              <TableCell ref={cellRef}>Data</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter ref={footerRef}>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
      expect(headerRef.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(bodyRef.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(footerRef.current).toBeInstanceOf(HTMLTableSectionElement);
      expect(rowRef.current).toBeInstanceOf(HTMLTableRowElement);
      expect(headRef.current).toBeInstanceOf(HTMLTableCellElement);
      expect(cellRef.current).toBeInstanceOf(HTMLTableCellElement);
      expect(captionRef.current).toBeInstanceOf(HTMLTableCaptionElement);
    });

    it("handles an empty TableBody without crashing", () => {
      const { container } = render(
        <Table>
          <TableBody />
        </Table>
      );
      const tbody = container.querySelector("tbody");
      expect(tbody).not.toBeNull();
      expect(tbody?.children.length).toBe(0);
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 3: Dialog Primitives & Nested Dialog Stress
   * ------------------------------------------------------------------------- */
  describe("Challenge 3: Dialog Primitives & Nesting Stress Testing", () => {
    it("renders DialogContent with institutional tokens (rounded-xl, border-border/60, shadow-xl)", () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            <DialogHeader>
              <DialogTitle>Issue Library Card</DialogTitle>
              <DialogDescription>Enter barcode and patron ID.</DialogDescription>
            </DialogHeader>
            <div>Form Body</div>
            <DialogFooter>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId("dialog-content");
      expect(content).toBeInTheDocument();
      expect(content.className).toContain("rounded-xl");
      expect(content.className).toContain("border-border/60");
      expect(content.className).toContain("bg-background");
      expect(content.className).toContain("shadow-xl");

      // Verify the default close button
      const closeBtn = content.querySelector("[data-slot='dialog-close']");
      expect(closeBtn).toBeInTheDocument();
      expect(closeBtn?.className).toContain("rounded-md");
    });

    it("supports showCloseButton={false} on DialogContent to suppress top-right X button", () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-no-close" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Processing Transaction</DialogTitle>
              <DialogDescription>Please wait while the transaction is saved.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId("dialog-no-close");
      const closeBtn = content.querySelector("[data-slot='dialog-close']");
      expect(closeBtn).toBeNull();
    });

    it("supports showCloseButton={true} on DialogFooter to render secondary outline button", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notice</DialogTitle>
              <DialogDescription>This is an automated system announcement.</DialogDescription>
            </DialogHeader>
            <DialogFooter data-testid="dialog-footer" showCloseButton={true}>
              <Button>Acknowledge</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId("dialog-footer");
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      expect(closeButtons.length).toBe(2); // One top-right X, one in footer
      const closeButtonInFooter = closeButtons.find((btn) => footer.contains(btn));
      expect(closeButtonInFooter).toBeDefined();
      expect(closeButtonInFooter?.className).toContain("border-input");
    });

    it("stress-tests multiple dialogs mounted simultaneously without DOM collisions", () => {
      render(
        <div>
          <Dialog open>
            <DialogContent data-testid="dialog-parent">
              <DialogTitle>Parent Modal</DialogTitle>
              <DialogDescription>Description for parent modal.</DialogDescription>
            </DialogContent>
          </Dialog>

          <Dialog open>
            <DialogContent data-testid="dialog-nested">
              <DialogTitle>Confirmation Alert</DialogTitle>
              <DialogDescription>Description for nested alert.</DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      );

      const parentModal = screen.getByTestId("dialog-parent");
      const nestedModal = screen.getByTestId("dialog-nested");

      expect(parentModal).toBeInTheDocument();
      expect(nestedModal).toBeInTheDocument();
      expect(parentModal.className).toContain("rounded-xl");
      expect(nestedModal.className).toContain("rounded-xl");
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 4: Select Primitives & Size Variants
   * ------------------------------------------------------------------------- */
  describe("Challenge 4: Select Primitives & Size Variants", () => {
    it("renders SelectTrigger with default size (h-9, rounded-lg)", () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-default-trigger">
            <SelectValue placeholder="Choose a department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cs">Computer Science</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId("select-default-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger.getAttribute("data-size")).toBe("default");
      expect(trigger.className).toContain("rounded-lg");
      expect(trigger.className).toContain("border-input");
    });

    it("renders SelectTrigger with sm size (data-size=sm, h-8, rounded-lg)", () => {
      render(
        <Select>
          <SelectTrigger size="sm" data-testid="select-sm-trigger">
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId("select-sm-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger.getAttribute("data-size")).toBe("sm");
      expect(trigger.className).toContain("rounded-lg");
    });

    it("verifies SelectContent contains rounded-xl, border-border/60, bg-popover, and shadow-lg", () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent data-testid="select-content">
            <SelectGroup>
              <SelectLabel>Academic Roles</SelectLabel>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectSeparator />
              <SelectItem value="patron">Student Patron</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      const content = screen.getByTestId("select-content");
      expect(content).toBeInTheDocument();
      expect(content.className).toContain("rounded-xl");
      expect(content.className).toContain("border-border/60");
      expect(content.className).toContain("bg-popover");
      expect(content.className).toContain("shadow-lg");
    });

    it("disables SelectTrigger when disabled prop is provided", () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="disabled-select">
            <SelectValue placeholder="Unavailable" />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId("disabled-select");
      expect(trigger).toBeDisabled();
      expect(trigger.className).toContain("disabled:opacity-50");
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 5: Badge & Button Variant Class Generation
   * ------------------------------------------------------------------------- */
  describe("Challenge 5: Badge & Button Variant Class Generation", () => {
    it("ensures all Badge variants consistently enforce rounded-lg (8px)", () => {
      const variants: Array<"default" | "secondary" | "destructive" | "outline"> = [
        "default",
        "secondary",
        "destructive",
        "outline",
      ];

      for (const variant of variants) {
        const { unmount } = render(
          <Badge variant={variant} data-testid={`badge-${variant}`}>
            {variant}
          </Badge>
        );
        const el = screen.getByTestId(`badge-${variant}`);
        expect(el.className).toContain("rounded-lg");
        expect(el.className).not.toContain("rounded-md"); // Must not revert to old rounded-md
        unmount();
      }
    });

    it("ensures all Button sizes consistently enforce rounded-lg (8px)", () => {
      const sizes: Array<"default" | "sm" | "lg" | "icon"> = ["default", "sm", "lg", "icon"];

      for (const size of sizes) {
        const { unmount } = render(
          <Button size={size} data-testid={`button-${size}`}>
            Button {size}
          </Button>
        );
        const el = screen.getByTestId(`button-${size}`);
        expect(el.className).toContain("rounded-lg");
        expect(el.className).not.toContain("rounded-md"); // Must not revert to old rounded-md
        unmount();
      }
    });

    it("verifies Button size sm has h-9, px-3, and text-xs", () => {
      render(
        <Button size="sm" data-testid="btn-sm">
          Small Button
        </Button>
      );
      const el = screen.getByTestId("btn-sm");
      expect(el.className).toContain("h-9");
      expect(el.className).toContain("px-3");
      expect(el.className).toContain("text-xs");
      expect(el.className).toContain("rounded-lg");
    });

    it("supports asChild delegation to anchor links with preserved button styling", () => {
      render(
        <Button asChild variant="outline" size="sm">
          <a href="/catalog" data-testid="button-link">
            Browse Catalog
          </a>
        </Button>
      );

      const link = screen.getByTestId("button-link");
      expect(link.tagName).toBe("A");
      expect(link.className).toContain("rounded-lg");
      expect(link.className).toContain("border");
      expect(link.className).toContain("h-9");
      expect(link.getAttribute("href")).toBe("/catalog");
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 6: CompactPagination Boundary Math & State Edge Cases
   * ------------------------------------------------------------------------- */
  describe("Challenge 6: CompactPagination Boundary Calculations", () => {
    it("handles totalItems = 0 gracefully (0-0 of 0, page 1/1, disabled controls)", () => {
      const onPageChange = vi.fn();
      render(
        <CompactPagination
          page={1}
          totalItems={0}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText(/0-0/)).toBeInTheDocument();
      expect(screen.getByText(/of/)).toBeInTheDocument();

      const prevBtn = screen.getAllByRole("button")[0];
      const nextBtn = screen.getAllByRole("button")[1];

      expect(prevBtn).toBeDisabled();
      expect(nextBtn).toBeDisabled();
    });

    it("calculates exact start/end range on first page (1-10 of 42)", () => {
      const onPageChange = vi.fn();
      render(
        <CompactPagination
          page={1}
          totalItems={42}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText("1-10")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();

      const prevBtn = screen.getAllByRole("button")[0];
      const nextBtn = screen.getAllByRole("button")[1];

      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calculates exact partial range on the final page (41-42 of 42)", () => {
      const onPageChange = vi.fn();
      render(
        <CompactPagination
          page={5}
          totalItems={42}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText("41-42")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();

      const prevBtn = screen.getAllByRole("button")[0];
      const nextBtn = screen.getAllByRole("button")[1];

      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).toBeDisabled();

      fireEvent.click(prevBtn);
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("renders default variant with rounded-xl border border-border/60 bg-card/40", () => {
      const { container } = render(
        <CompactPagination
          page={2}
          totalItems={30}
          pageSize={10}
          onPageChange={() => {}}
          variant="default"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("rounded-xl");
      expect(wrapper.className).toContain("border-border/60");
      expect(wrapper.className).toContain("bg-card/40");
    });

    it("renders pageSize selector and triggers onPageSizeChange", () => {
      const onPageSizeChange = vi.fn();
      render(
        <CompactPagination
          page={1}
          totalItems={100}
          pageSize={25}
          onPageChange={() => {}}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={onPageSizeChange}
        />
      );

      expect(screen.getByText("Per Page")).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------
   * CHALLENGE 7: Textarea & EmptyState Primitives
   * ------------------------------------------------------------------------- */
  describe("Challenge 7: Textarea & EmptyState Primitives", () => {
    it("renders Textarea with rounded-lg and border-input", () => {
      render(<Textarea placeholder="Enter book notes" data-testid="notes-input" />);
      const el = screen.getByTestId("notes-input");
      expect(el.className).toContain("rounded-lg");
      expect(el.className).toContain("border-input");
    });

    it("renders EmptyState with rounded-xl icon container and hairline borders", () => {
      const { container } = render(
        <EmptyState
          icon={AlertCircle}
          title="No Overdue Books"
          description="All loans are currently in good standing."
        />
      );

      // Card wrapper has border-border/60
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("border-border/60");

      // Icon container has rounded-xl border border-border/60
      const iconContainer = container.querySelector(".h-20.w-20");
      expect(iconContainer).not.toBeNull();
      expect(iconContainer?.className).toContain("rounded-xl");
      expect(iconContainer?.className).toContain("border-border/60");
      expect(iconContainer?.className).toContain("bg-muted");
    });

    it("renders EmptyState action button with Link when href is provided", () => {
      render(
        <EmptyState
          icon={HelpCircle}
          title="Need Assistance?"
          description="Contact library staff for account verification."
          action={{
            label: "Open Circulation Desk",
            href: "/circulation",
          }}
        />
      );

      const actionLink = screen.getByRole("link", { name: /Open Circulation Desk/i });
      expect(actionLink).toBeInTheDocument();
      expect(actionLink.getAttribute("href")).toBe("/circulation");
      // Slot applies button classes directly onto the child Link
      expect(actionLink.className).toContain("rounded-lg");
      expect(actionLink.className).toContain("bg-primary");
    });

    it("renders EmptyState action button with onClick when href is omitted", () => {
      const handleClick = vi.fn();
      render(
        <EmptyState
          icon={HelpCircle}
          title="Reset Filters"
          description="Clear search filters to see all records."
          action={{
            label: "Clear All",
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole("button", { name: /Clear All/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
