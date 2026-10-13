---
name: Lumina LMS
description: Advanced Institutional Library Management System
colors:
  primary: "#1e293b"
  primary-foreground: "#ffffff"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-text: "#0f172a"
  neutral-muted: "#64748b"
  border: "#cbd5e1"
  destructive: "#dc2626"
  status-success: "#15803d"
  status-warning: "#b45309"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "#0f172a"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: Lumina LMS

## Overview

**Creative North Star: "The Modern Institutional Ledger"**

Lumina LMS pairs academic rigor and administrative durability with contemporary software ergonomics. Designed for heavy daily usage by desk librarians and rapid interactions by students, the interface emphasizes high typographic clarity, structured tabular density, and clean information hierarchy.

Surfaces favor clean white containers over tinted slate backgrounds, avoiding visual clutter and keeping attention on circulation status, inventory numbers, and actionable alerts.

**Key Characteristics:**
- Disciplined slate-navy primary foundation with purposeful status accents.
- Structured card and table containers with subtle borders and micro-shadows.
- High-contrast legibility using geometric humanist typography (Manrope).
- High visual scannability optimized for high-density checkout and inventory flows.

## Colors

The palette is restrained, professional, and audit-ready, using color strictly for structural hierarchy and operational status.

### Primary
- **Institutional Slate** (`#1e293b` / `hsl(221 39% 20%)`): Primary navigation headers, prominent CTA buttons, and key structural landmarks.

### Neutral
- **Page Canvas** (`#f8fafc` / `hsl(210 20% 98%)`): App-wide canvas background with soft vertical rhythm.
- **Surface Pure** (`#ffffff` / `hsl(0 0% 100%)`): Table rows, cards, modal panels, and elevated containers.
- **Deep Slate Text** (`#0f172a` / `hsl(222 47% 11%)`): Primary headlines, body text, and active table cells.
- **Muted Steel** (`#64748b` / `hsl(215 16% 38%)`): Secondary labels, timestamps, metadata, and placeholder text.
- **Border Subtle** (`#cbd5e1` / `hsl(214 20% 87%)`): Grid dividers, field boundaries, and card strokes.

### Semantic Status
- **Success Forest** (`#15803d` / `hsl(142 72% 32%)`): Available book status, successful check-in, active standing.
- **Warning Amber** (`#b45309` / `hsl(38 92% 38%)`): Approaching due date, pending reservation, reservation hold.
- **Critical Crimson** (`#dc2626` / `hsl(0 65% 45%)`): Overdue circulation, suspended patron, unpaid fines, destructive actions.

### Named Rules
**The Status Purpose Rule.** Status colors (green, amber, red) are reserved exclusively for operational state (due dates, active penalties, inventory availability); they are never used for decorative accents.

## Typography

**Display Font:** Manrope (`sans-serif`)
**Body Font:** Manrope (`sans-serif`)
**Label/Mono Font:** Manrope with numeric tabular figures (`font-variant-numeric: tabular-nums`)

**Character:** Humanist geometric sans with open apertures, distinct numerals, and superior legible scanning at dense scales.

### Hierarchy
- **Display** (700, `clamp(2rem, 5vw, 3rem)`, line-height 1.15): Major portal entrances and overview dashboard headings.
- **Headline** (700, `1.75rem` / `28px`, line-height 1.25): Page headers and module section titles.
- **Title** (600, `1.25rem` / `20px`, line-height 1.35): Section cards, modal headers, dialog titles.
- **Body** (400, `0.875rem` / `14px`, line-height 1.5): Standard UI copy, table cells, form labels.
- **Label** (600, `0.75rem` / `12px`, letter-spacing `0.02em`, uppercase/small-caps): Table headers, badge pills, metadata tags.

## Layout

- **Shell:** Sidebar navigation layout (`w-64`) paired with responsive main viewports and sticky headers.
- **Container Rhythm:** Max container width `max-w-7xl` with standardized page padding (`px-4 sm:px-6 lg:px-8`).
- **Grid Systems:** 12-column responsive grid with consistent 16px/24px gutters.

## Elevation & Depth

Surfaces rely on tonal layering and crisp 1px borders rather than heavy ambient blur.

### Shadow Vocabulary
- **Subtle Rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Standard cards, stat tiles, input surfaces.
- **Elevated Hover** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Interactive cards and dropdown menus.
- **Modal Float** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): Dialogs, slide-overs, and popovers.

### Named Rules
**The Crisp Boundary Rule.** Every elevated surface or card container must carry a subtle border (`border-border`) to maintain high boundary contrast on varying screen brightness.

## Shapes

- **Radius Scale:**
  - Small elements (badges, buttons, inputs): `rounded-lg` (8px).
  - Main cards, dialogs, and table shells: `rounded-xl` (12px).
- **Strokes:** Standard 1px border width across all containers.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px), height 40px (default), 36px (sm), 44px (lg).
- **Primary:** Background `#1e293b`, text `#ffffff`, font-weight 600, hover `#0f172a`.
- **Secondary / Outline:** Background `#ffffff`, border `#cbd5e1`, text `#0f172a`, hover `#f1f5f9`.
- **Destructive:** Background `#dc2626`, text `#ffffff`, hover `#b91c1c`.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `#ffffff`.
- **Border:** `1px solid #cbd5e1`.
- **Padding:** 16px (compact) to 24px (standard).

### Inputs / Fields
- **Style:** Height 40px, `rounded-lg`, border `#cbd5e1`, background `#ffffff`.
- **Focus:** Ring `hsl(221 39% 28% / 0.4)` with 1px ring offset.

## Do's and Don'ts

### Do:
- **Do** maintain tabular numerals for ISBNs, barcode scans, counts, and financial amounts.
- **Do** preserve 12px outer radius for primary card containers and 8px for controls.
- **Do** reserve high-saturation warning/destructive badges strictly for policy-related indicators.

### Don't:
- **Don't** use decorative gradients or ungrounded heavy shadows behind text.
- **Don't** replace high-contrast dark text with low-contrast gray in data tables.
- **Don't** mix multiple sans-serif fonts; preserve Manrope consistently.
