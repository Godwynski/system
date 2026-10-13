# Test Infrastructure & Execution Guide: Lumina LMS E2E Testing Suite

## 1. Overview & Architecture

The Lumina LMS E2E Test Suite provides comprehensive, requirement-driven, opaque-box verification across the application's site-wide UI harmonization and "Modern Institutional Ledger" design system. The suite is engineered to run completely hermetically without requiring external database credentials, network calls, or browser binaries.

### Technology Stack
- **Test Runner**: Vitest 4.1.7 (`test/setup.ts`, `vitest.config.ts`)
- **DOM Environment**: JSDOM 29.1.1
- **Testing Utilities**: `@testing-library/react`, `@testing-library/jest-dom`
- **Compiler**: TypeScript 5.x with strict typechecking
- **Framework**: Next.js 16 App Router, React 19, Tailwind CSS

---

## 2. Tiered Testing Methodology

The test suite systematically covers Tiers 1 through 4 as mandated by the dual-track testing specifications:

### Tier 1: Feature Coverage (Design Tokens & Surfaces)
- **File**: `test/e2e/tier1-design-tokens.test.tsx`
- **Scope**:
  - Root radius tokens in `app/globals.css` (`--radius: 0.5rem;`), ensuring `rounded-lg` evaluates to 8px and `rounded-xl` to 12px.
  - Institutional semantic status color tokens: Success Forest (`#15803d`), Warning Amber (`#b45309`), Critical Crimson (`#dc2626`), and Neutral Muted (`#64748b`).
  - Manrope typography system specifications and 5-tier typographic scale.
  - Controls standardization on `rounded-lg` (8px): `Button`, `Input`, `Badge`.
  - Container standardization on `rounded-xl` (12px): `Card`, `DialogContent`.
  - Crisp Boundary Rule: 1px hairline borders (`border-border/60`, `border-input`).
  - Semantic `StatusBadge` mapping for domain statuses (`AVAILABLE`, `BORROWED`, `LOST`, `READY`, `OVERDUE`).
  - Core UI surfaces: `EmptyState` and `Skeleton` primitives.

### Tier 2: Boundary & Corner Cases (Adversarial Robustness)
- **File**: `test/e2e/tier2-boundary-corner-cases.test.tsx`
- **Scope**:
  - Purge of arbitrary pixel font off-ramps (`text-[8px]`, `text-[10px]`) from canonical UI primitives.
  - Purge of extreme radii (`rounded-[3rem]`, `rounded-[2rem]`, `rounded-[50px]`).
  - Zero mock data resilience: `LuminaTable` renders clean empty state with empty arrays (`data=[]`) without synthesizing fake rows or pagination.
  - Adversarial input handling: unrecognized statuses in `StatusBadge` fall back to `status-neutral`; unrecognized roles in `RoleBadge` render safely.
  - DOM injection resilience: HTML script tags, XML entities, and emoji sequences in `EmptyState` render safely without unescaped execution.
  - Disabled controls enforce pointer-events isolation and disabled styling.

### Tier 3: Cross-Feature Combinations (Integration Matrix)
- **File**: `test/e2e/tier3-cross-feature-combinations.test.tsx`
- **Scope**:
  - Role-based authorization matrix (`hasPermission`, `ROLE_RANKS`, `isStaff`, `isAccessBlocked`) across super_admin, librarian, student_assistant, and student roles.
  - Deactivated staff isolation: student assistant with inactive status is denied access to staff tools.
  - Modal lifecycle: `Dialog` trigger open, portal mounting with `rounded-xl` and `border-border/60`, and dismissal via `DialogClose`.
  - Data table state transitions: dynamic toggling between populated rows and `<EmptyState>` without state contamination.
  - Responsive layout contracts: mobile view (`md:hidden`) vs desktop table (`hidden md:table`).

### Tier 4: Real-World Workflows (Operational Scenarios)
- **File**: `test/e2e/tier4-real-world-workflows.test.tsx`
- **Scope**:
  - Circulation desk full checkout lifecycle:
    - Step 1: Student identification scan (`ScanStep`).
    - Step 2: Book item barcode scan (`ScanStep`).
    - Step 3: Loan parameters review (`ReviewStep`).
    - Step 4: Loan issuance receipt & reset trigger (`SuccessStep`).
  - Circulation desk return & hold shelf fulfillment notice.
  - Physical inventory ledger management: `ModernBookCard` rendering with authentic copy pool tracking and out-of-stock badges.
  - Immutable audit trail record inspection with status badges.

### Master Aggregator
- **File**: `test/e2e/ui-harmonization.test.ts`
- **Scope**: Validates design specification documents (`DESIGN.md`, `PRODUCT.md`, `PROJECT.md`), CSS token definitions, and registers all test tier manifests.

---

## 3. Verification Commands

All tests execute hermetically via standard package scripts:

### Execute Full E2E Test Suite
```bash
npm test -- run test/e2e/
```

### Execute Individual Tiers
```bash
npx vitest run test/e2e/tier1-design-tokens.test.tsx
npx vitest run test/e2e/tier2-boundary-corner-cases.test.tsx
npx vitest run test/e2e/tier3-cross-feature-combinations.test.tsx
npx vitest run test/e2e/tier4-real-world-workflows.test.tsx
npx vitest run test/e2e/ui-harmonization.test.ts
```

### Static Analysis Verification
```bash
npm run typecheck
npm run lint
```

---

## 4. Test File Manifest & Metrics

| Test Suite | Tier | Tests | Status |
|---|---|---|---|
| `test/e2e/ui-harmonization.test.ts` | Master | 5 | PASSED |
| `test/e2e/tier1-design-tokens.test.tsx` | Tier 1 | 21 | PASSED |
| `test/e2e/tier2-boundary-corner-cases.test.tsx` | Tier 2 | 21 | PASSED |
| `test/e2e/tier3-cross-feature-combinations.test.tsx` | Tier 3 | 9 | PASSED |
| `test/e2e/tier4-real-world-workflows.test.tsx` | Tier 4 | 9 | PASSED |
| **Total Suite** | **Tiers 1-4** | **65** | **100% PASS** |
