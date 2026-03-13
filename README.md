# Library Management System (LMS) — Comprehensive Project Plan

> Version 3.9 (Hybrid Local/Cloud Architecture - Vercel/Supabase Hardening) | Last Updated: March 2026

This document outlines the full scope, architecture, modules, sub-modules, and functionalities for the Library Management System. The system follows **Industry-Standard** design patterns and Serverless scalability, is built **Mobile-First**, and enforces **User-Friendly** interactions (modals, tooltips, guided tours) throughout all flows.

---

## 1. System Architecture & Tech Stack (Hybrid Offline-First)

**Architecture Shift (v3.0):** The system is now designed as a **Hybrid Offline-First** application. The primary source of truth and all heavy operations (Librarian dashboard, physical circulation, PDF serving, cron jobs) run on a **Local Area Network (LAN) Server** physically located in the school. A **Lightweight Public Portal** runs on the cloud exclusively for students to view the catalog and view their library card.

| Layer                 | Technology                                            | Rationale                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend (Local)**  | Next.js 14 (App Router)                               | Intranet portal for Librarians & in-school students. Blazing fast, zero internet dependency.                                                                                                                                                                                                                                                      |
| **Frontend (Public)** | Next.js 14 (Exported/Vercel Free)                     | Student-facing public portal (Catalog, My Card, Borrows).                                                                                                                                                                                                                                                                                         |
| **Backend (Local)**   | Node.js / Next.js API Routes                          | Runs on the school server (e.g., Mini PC, Intel NUC, or robust Raspberry Pi 5).                                                                                                                                                                                                                                                                   |
| **Database (Local)**  | PostgreSQL (Local Native)                             | Primary source of truth. No cloud database limits, infinite free storage.                                                                                                                                                                                                                                                                         |
| **Database (Cloud)**  | Supabase (Free Tier)                                  | Scaled-down read-heavy replica for the public portal. Synchronized from the local server.                                                                                                                                                                                                                                                         |
| **File Storage**      | Local Disk (`/uploads`)                               | Heavy PDFs and book covers are stored directly on the school server's hard drive (infinite free storage).                                                                                                                                                                                                                                         |
| **Auth**              | NextAuth.js (Local) + Supabase Auth + Microsoft OAuth | **Students:** Single Sign-On via school Microsoft (Azure AD) account — no separate password or OTP needed. **Staff:** Local bcrypt sessions on the intranet portal.                                                                                                                                                                               |
| **Background Jobs**   | local `node-cron` or `PM2`                            | Runs securely on the school server without Vercel free-tier limitations.                                                                                                                                                                                                                                                                          |
| **Email**             | Resend                                                | 3,000 free emails/month. Sent from the local server when internet is available.                                                                                                                                                                                                                                                                   |
| **Sync Engine**       | Custom Sync Script (Node.js + PM2)                    | A local background worker periodically pushes Catalog updates and approved library cards to the Supabase Cloud DB. **Cloud DB is strictly read-only for students.** On sync failure, the cloud portal displays a _"Live availability may be delayed"_ banner. Cloud sync queues are processed periodically. **Local DB always wins on conflict.** |

### Core Design & UX Principles

- **Mobile-First Navigation:** Core user flows utilize a Bottom Navigation Bar on mobile (Home, Catalog, Scanner, My Card, Profile) and a collapsible sidebar on desktop.
- **Accessibility (a11y):** WCAG 2.1 AA compliance — proper ARIA labels, keyboard navigation, safe color contrast ratios. All interactive elements require focus-visible outlines.
- **User-Friendly Feedback & Modals:** All critical actions require clear Modal Alerts (confirm/cancel). Destructive actions use red warning modals. Success/error state changes trigger Toast Notifications with auto-dismiss.
- **Contextual Help:** Small `(i)` info icons and tooltips are placed beside complex policies (e.g., Fines, Renewals) to proactively guide users without cluttering the UI.
- **Security & Scale:** HTTPS enforced on both local and public portals (the local intranet requires IT to set up Caddy as a reverse proxy for automated local HTTPS or deploy a local self-signed certificate with the CA pushed to school devices). Parameterized SQL queries via Prisma on both databases. Strict input schema validation using **Zod** on both client and server. **Local portal:** PostgreSQL-level role restrictions enforced via server middleware (bcrypt sessions). **Cloud portal:** Row Level Security (RLS) enforced at the Supabase layer via Supabase Auth; `auth.uid()` resolves automatically on every query. No Redis dependency — rate limiting on the public portal is handled by Vercel's built-in edge protection; the local portal is inherently protected by LAN access control.
- **Progressive Web App (PWA):** A `manifest.json` and a Workbox-based service worker enable offline caching for specific routes: `/catalog` (static shell + last-fetched page), `/my-card`, and `/my-borrowing-history`. If a student is offline, a clear UI Banner appears: _"You are offline. Search is disabled, but you can view your digital library card and currently borrowed books."_ All other routes (renewal, checkout) require connectivity and display a friendly _"You're offline — this action requires internet"_ modal instead of silently failing. Screen reverts to an offline fallback page (`/offline`) for uncached routes.

---

## 2. User Roles & Permissions

| Permission                          | Super Admin | Librarian  | Student |
| ----------------------------------- | :---------: | :--------: | :-----: |
| Manage Admins & Librarians          |     ✅      |     ❌     |   ❌    |
| Manage Students / Accounts          |     ✅      |     ✅     |   ❌    |
| Manage Book Catalog                 |     ✅      |     ✅     |   ❌    |
| Manage Book Categories & Tags       |     ✅      |     ✅     |   ❌    |
| Process Borrow / Return             |     ✅      |     ✅     |   ❌    |
| Process Renewals                    |     ✅      |     ✅     |   ❌    |
| Approve E-Library Cards             |     ✅      |     ✅     |   ❌    |
| Manage Fines (Pay / Waive)          |     ✅      |     ✅     |   ❌    |
| View Own Borrowing History          |     ✅      |     ✅     |   ✅    |
| Renew Borrowed Books (Self-Service) |     ✅      |     ✅     |   ✅    |
| View E-Library Card                 |     ✅      |     ✅     |   ✅    |
| Access Digital Resources            |     ✅      |     ✅     |   ✅    |
| View Reports & Analytics            | ✅ (Local)  | ✅ (Local) |   ❌    |
| Configure System Settings           | ✅ (Local)  |     ❌     |   ❌    |
| View Audit Logs                     | ✅ (Local)  |     ❌     |   ❌    |

---

### The Hybrid Sync Boundary

- **What lives exclusively on the Local Server (School LAN):** The full PostgreSQL database, all audit logs, configurations, librarian dashboards, circulation flows, PDF files, and the automated Cron engine.
- **What is pushed to the Cloud (Public Internet):** A read-only subset synced outwards to Supabase: Book Catalog, active Library Cards, and sanitized Borrowing summaries (no fine details, no PII beyond name/card number).
- **What is pulled from the Cloud:** E-Library Card registration requests (`student_profiles_pending`) are written to the Supabase Cloud DB by students, then pulled down to the Local DB by the sync worker polling the `sync_queue` table on each cycle. The worker performs a hard `DELETE` on the cloud records immediately after successful sync to prevent Supabase storage bloat.
- **Sync Failure & Conflict Strategy:** The Local DB is the authoritative write source — it always wins on conflict. If internet is unavailable, the cloud portal displays a _"Live catalog data may be delayed"_ info banner. Outbound sync failures are retried with exponential backoff.
- **[NEW] Sync Worker Cloud Heartbeat:** To prevent the cloud portal from silently serving dangerously stale data if the local server is turned off (e.g., during school holidays or power outages), the Sync Worker updates a `cloud_heartbeat` timestamp in Supabase every 5 minutes. If this timestamp is older than 15 minutes, the Cloud Portal automatically displays a warning: _"Library Server is offline. Data shown is read-only and may be out of date."_

# ## 3. Database Schema Overview

### Core Tables

- `users` — **Unified profile table** for all roles. Fields: id (UUID PK), `auth_provider` (`'microsoft'` | `'local'`), `supabase_uid` (UUID, **nullable** — populated only for students who authenticate via Supabase + Microsoft OAuth), `password_hash` (text, **nullable** — populated only for local staff accounts via bcrypt), `supabase_avatar_url` (text, **nullable** — URL to the student's profile picture stored in Supabase Storage, synced to local DB as a reference; staff avatars are stored on local disk), name, email, role (`super_admin` / `librarian` / `student`), `student_id` (text — auto-parsed from school Microsoft email on first login; STI Alabang format: `lastname.studentid@alabang.sti.edu.ph`, e.g., `reyes.20240001@...` → `student_id = '20240001'`), department, contact_number, is_active, notification_preferences (JSONB — e.g., `{ email_reminders: true, sms_overdue: false }`), created_at, updated_at. The local auth middleware reads `auth_provider` to route login: students are verified against Supabase/Microsoft OAuth; staff are verified against the local `password_hash`.
- `library_cards` — id, user_id (FK), card_number, status (`active` / `suspended` / `expired`), issued_at, expires_at. _(Note: `qr_code_url` is intentionally absent — QR codes are generated dynamically at render time from `card_number` using the `qrcode` npm package.)_
- `categories` — id, name, slug, description _(New: enables genre/subject classification)_
- `books` — id, title, author(s), isbn, publisher, edition, category_id (FK), tags (text[]), location (rack/shelf), cover_url, total_copies, available_copies, **is_active** (boolean, default `true` — soft-delete for retired books to preserve historical borrowing records), created_at, updated_at
- `book_copies` — id, book_id (FK), copy_number, `qr_code` (text, unique — auto-generated by a **dedicated PostgreSQL sequence** `book_copy_qr_seq`, formatted as `COPY-{YYYYMMDD}-{LPAD(seq,8,'0')}`, guaranteeing global uniqueness even on concurrent inserts without application-level race conditions), condition (`good` / `damaged` / `lost`), status (`available` / `borrowed` / `lost` / `retired`). _(`retired` = permanently withdrawn from circulation — e.g., severely damaged — without triggering fines. Preserved in DB to maintain borrowing history.)_ **[RISK-02]** Physical `DELETE` of `book_copies` rows is prohibited — only status transitions are permitted. FK is explicitly `ON DELETE RESTRICT`. A DB-level trigger `BEFORE DELETE ON book_copies` raises `EXCEPTION 'Physical deletion of book_copies is prohibited. Use status=retired instead.'` for the `lms_app_user` role.
- `borrowing_records` — id, user_id (**nullable FK**, `ON DELETE SET NULL`), **user_display_name** (text, snapshot fallback), book_copy_id (**FK → `book_copies(id)` `ON DELETE RESTRICT`**), processed_by (FK → users), borrowed_at, due_date, returned_at, renewal_count, status (`active` / `returned` / `overdue`). _Note: UI queries should fetch the live user relation via `user_id` for active borrows to correctly reflect legal name changes mid-semester. The `user_display_name` snapshot serves purely as a fallback for historically returned records when `user_id` evaluates to NULL._
- `renewals` — id, borrowing_record_id (FK), renewed_by (FK → users), renewed_at, new_due_date _(New: separate table for clean renewal auditing)_
- `violation_tickets` — id, user_id (**nullable FK**, `ON DELETE SET NULL`), **user_display_name** (text, snapshot), borrowing_record_id (**nullable FK** — linked if the violation stems from a circulation event), type (enum: `overdue_return` | `lost_book` | `damaged_book` | `unauthorized_access` | `other`), severity (`warning` | `minor` | `major`), description (text NOT NULL, minimum 10 characters — mandatory written explanation for accountability), status (`open` | `resolved` | `dismissed`), issued_by (FK → users — the librarian who issued the ticket), resolved_by (**nullable FK** → users — populated when ticket is resolved or dismissed), issued_at, resolved_at, notes (text — optional resolution notes). _No monetary amounts exist in this table. Consequences are administrative: card suspension triggered by accumulated ticket count/severity thresholds, configurable in Settings._
- `digital_resources` — id, title, author, `file_path` (local filesystem path, e.g., `/uploads/resources/d9b2d63d.pdf` — **never a public URL**), file_size_mb, type (`ebook` / `journal` / `thesis`), category_id (FK), access_level (`public` / `restricted`), uploaded_by, created_at
- `email_queue` — id, to_email, subject, html_body, status (`pending` / `sent` / `failed`), attempts (int, default 0), `last_error` (text), created_at, sent_at. _(Dedicated outbox table for reliable email delivery via Resend. The node-cron flush job queries only this table, retrying failed sends up to 3 times before marking `failed`.)_
- `offline_pins` — id, user_id (FK), `pin_hash` (bcrypt of 6-digit PIN — never stored plain), created_at, expires_at, `used_at` (nullable — set on first successful use to prevent replay attacks; PIN is invalidated after a single session).
- `book_holds` — id, user_id (FK), book_id (FK → books), status (`waiting` | `ready` | `fulfilled` | `cancelled` | `expired`), requested_at, notified_at (nullable — timestamp when student was told their hold is ready), expires_at (nullable — hold reservation expires N days after `notified_at` if not collected, configurable in Settings). _Book return triggers an automatic check of the hold queue for that title._
- `data_erasure_log` — id, `actor_id` (nullable FK, `ON DELETE SET NULL`), `actor_display_name` (text NOT NULL, snapshot), `subject_user_display_name` (text, e.g., `"Juan Reyes (Student 20240001)"`), `fields_erased` (text[]), erased_at. _(Same DB-level append-only immutability as `audit_logs` — enforced via `BEFORE DELETE OR UPDATE` trigger, see immutability section below.)_
- `sync_queue` — id (UUID PK), `entity_type` (`'new_user'`), `entity_id` (UUID — references the cloud-side entity being synced), `direction` (`'cloud_to_local'`), `status` (`'pending'` | `'processing'` | `'done'` | `'failed'`), `payload` (JSONB — full snapshot of the cloud entity at queue time), created_at, processed_at, `error_message` (text), `retry_count` (int, default 0). _(The local PM2 Sync Worker queries this table on every poll to process pending inbound data. Written by the Sync Worker itself when it detects cloud changes — not directly by the student.)_
- `sync_worker_heartbeat` — id (single-row, PK=1), `last_seen_at` (timestamptz, updated on every poll cycle by the Sync Worker). **[RISK-01]** A separate PM2-managed watchdog process checks this table every 10 minutes. If `last_seen_at` is stale by >15 minutes, the watchdog inserts an in-app `notifications` alert for the Super Admin and executes `pm2 restart sync-worker`.
- `notifications` — id, user_id (FK), type, message, channel (`in_app` / `email`), is_read, sent_at
- `audit_logs` — id, actor_id (**nullable UUID FK**, `ON DELETE SET NULL`), **actor_display_name** (text NOT NULL, snapshot e.g. `"John Doe (Librarian)"` — written at insert time, remains after user deletion), action, target_table, target_id, old_value (JSON), new_value (JSON), ip_address, created_at
  - **Scope:** Covers all admin/config changes AND librarian circulation actions — every checkout (`processed_by`), return, renewal, fine payment, fine waiver, and card approval emits an `audit_logs` entry. This ensures full accountability for all staff-level operations. Even after a user erasure, the `actor_display_name` snapshot preserves readable history.
  - **[RISK-04 — Partition-Safe Immutability on Local PostgreSQL]:** `CREATE RULE` does **NOT** propagate to child partition tables in PostgreSQL — using a rule would silently break as soon as log partitioning is activated. Instead, immutability must be enforced via a `BEFORE DELETE OR UPDATE` trigger which _does_ propagate to all partitions:

    ```sql
    CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Modification of audit_logs is strictly prohibited.';
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trig_immutable_audit_logs
    BEFORE DELETE OR UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
    ```

    Additionally: `REVOKE DELETE, UPDATE, TRUNCATE ON audit_logs FROM lms_app_user;`. Both layers are required — the REVOKE prevents the operation at the role level; the trigger provides defence-in-depth if a super-user role is ever used via application code.

- `settings` — id, key (unique), value, description, updated_by (FK → users), updated_at

### Key Database Constraints & Indexes

- Unique constraint: `books.isbn`, `library_cards.card_number`, `settings.key`, `users.email`, **`book_copies.qr_code`** _(generated by `book_copy_qr_seq` PostgreSQL sequence — uniqueness guaranteed at DB engine level, preventing collisions even on concurrent inserts by multiple librarians)_
- Index on: `borrowing_records.status`, `borrowing_records.due_date` (required for efficient daily cron overdue queries)
- Index on: `violation_tickets.user_id + status` (for fast student profile lookups)
- Index on: `book_holds.book_id + status` (for efficient hold queue lookups on return)
- Index on: `notifications.user_id + is_read`
- **Prisma Migrations Strategy:** All schema changes must go through `prisma migrate dev` locally and `prisma migrate deploy` in CI/CD. Never apply raw SQL directly to the production database without a corresponding migration file committed to version control.
- **`book_copy_qr_seq` Raw SQL Migration [Required]:** Prisma's schema DSL does not support custom PostgreSQL sequences. After the initial `prisma migrate deploy`, a dedicated raw SQL migration file must be applied once to create the sequence and attach it as the column default:

  ```sql
  CREATE SEQUENCE IF NOT EXISTS book_copy_qr_seq START 1;
  ALTER TABLE book_copies ALTER COLUMN qr_code
    SET DEFAULT 'COPY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('book_copy_qr_seq')::text, 8, '0');
  ```

  This guarantees atomic, collision-free QR value generation even under concurrent inserts.

- **`update_available_copies` Trigger [Required]:** A PostgreSQL trigger cascades `book_copies.status` changes to `books.available_copies`. **[RISK-03]** The trigger body is wrapped in an exception handler to prevent trigger errors from silently rolling back the parent transaction — errors are logged as PostgreSQL `WARNING` notices instead of crashing the caller:

  ```sql
  CREATE OR REPLACE FUNCTION update_available_copies()
  RETURNS TRIGGER AS $$
  BEGIN
    BEGIN
      UPDATE books
      SET available_copies = (
        SELECT COUNT(*) FROM book_copies
        WHERE book_id = COALESCE(NEW.book_id, OLD.book_id) AND status = 'available'
      )
      WHERE id = COALESCE(NEW.book_id, OLD.book_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'update_available_copies trigger error: % (book_id: %)',
        SQLERRM, COALESCE(NEW.book_id, OLD.book_id);
    END;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trig_update_available_copies
  AFTER INSERT OR UPDATE OF status OR DELETE ON book_copies
  FOR EACH ROW EXECUTE FUNCTION update_available_copies();
  ```

---

## 4. Modules, Sub-Modules & Functionalities

### Cloud (Supabase) Database Schema

The Supabase cloud database is **intentionally minimal** — it is not a full replica of the local DB. It stores only what the public student portal needs to read or submit. The local DB is the single source of truth; this is a lightweight read/write cache.

**Tables synced UP (local → Supabase) by the PM2 Sync Worker:**

- `books` — id, title, author(s), isbn, category_id, tags, cover_url (Supabase Storage thumbnail URL), total_copies, available_copies, is_active. _(No `location`, no internal notes — these are operationally internal.)_
- `categories` — id, name, slug
- `library_cards` — id, supabase_uid (FK → `auth.users`), card_number, status, expires_at. _(The student's cloud portal reads this to display their card.)_
- `digital_resources_catalog` — id, title, author, type, category_id, access_level. _(Metadata ONLY — `file_path` is never synced to the cloud.)_

**Tables written by the cloud portal (Supabase) and pulled DOWN by the PM2 Sync Worker:**

- `student_profiles_pending` — id, supabase_uid, department, avatar_url. _(Students complete their Profile Completion step on the cloud portal. **[RISK-10 — Delete-After-Commit Safety]:** The Sync Worker processes each record as a two-phase operation: Phase 1 — write the data to the local `users` table inside a local DB transaction and commit. Phase 2 — only if Phase 1 committed successfully, execute the cloud `DELETE` via `service_role`. On local write failure, the cloud DELETE is skipped and the `sync_queue` retry counter is incremented. This prevents permanent profile data loss when the local DB write fails. **Must have a unique constraint on `supabase_uid`** in the cloud schema to prevent race conditions on duplicate form submissions.)_

**RLS Policies (Supabase Cloud):**

- Students can only `SELECT` their own `library_cards` row (`auth.uid() = supabase_uid`).
- Students can `INSERT` into `student_profiles_pending` only for their own `supabase_uid`.
- `UPDATE` and `DELETE` on all cloud tables are blocked for all non-service roles. Only the Sync Worker (using the `service_role` key, stored in `.env` as `chmod 600`, never committed to version control) can modify cloud data.

---

### Module 1: Authentication & User Management

**Purpose:** Securely manage access for all user types with a frictionless onboarding experience.

#### 1.1 Registration & Onboarding

- **Students:** No manual registration form. Students click _"Sign in with Microsoft"_ on the public portal. Supabase Auth handles the OAuth flow with the **school's Azure AD tenant** — the student's existing STI Alabang Microsoft account (`lastname.studentid@alabang.sti.edu.ph`) is the identity. No separate password or OTP email is ever created or sent by the system.
  - On first login, the student's entry in Supabase `auth.users` is created. **[CORRECTION]** The local PM2 Sync Worker (already polling every 5 minutes) includes a task to query Supabase `auth.users` for any new `id` values not yet present in the local `users.supabase_uid` column, and automatically creates the corresponding local `users` row and a `pending` library card. A Supabase Webhook is **not used** because the school LAN has no public IP for Supabase to POST to.
  - **Auto-Parse from Email:** On first-login row creation, the sync worker parses the school email to auto-populate `student_id` (the numeric segment, e.g., `20240001`) and `name` (from the Azure AD profile claims). Zero manual data entry is required from either the student or librarian.
  - **Profile Completion Step:** After first login, the cloud portal shows a mandatory one-time form (cannot be dismissed) requiring the student to: (1) select their `department` from a dropdown of the school's official departments, and (2) optionally upload a profile picture to Supabase Storage. This data is written to `student_profiles_pending` on the cloud DB and synced to the local `users` row on the next worker cycle. **The library card remains `pending` and non-functional until this step is completed AND a Librarian approves the card**, ensuring the librarian always sees a completed identity profile before granting access.
  - A Library Card is auto-generated (`status = 'pending'`) awaiting both student profile completion and Librarian approval.
  - **[RISK-07 — Pending Account UI]:** On the cloud portal, if an authenticated student's `library_cards` query returns 0 rows (i.e., the sync worker has not yet processed their first login), the portal must render a friendly informational banner: _"Your account is being set up — this usually takes up to 5 minutes. Please refresh this page."_ A blank page or unhandled auth redirect loop here is a confirmed failure mode.
- **Admin/Librarian accounts** are created exclusively by a Super Admin from the local admin panel (not self-registered). An auto-generated temporary password is emailed to the staff member via Resend, who must change it on first login.

#### 1.2 Login & Session Management

- **Librarians/Admins (Local Network):** Log in via direct access to the intra-school portal. Authenticated via standard hashed passwords (bcrypt) stored in the local Postgres DB.
- **Students (Public Portal):** Log in via Supabase Auth on the Vercel-hosted frontend.
- **UX:** Clear error modals for wrong credentials. A friendly warning is shown after 3 failed attempts to inform the user.

#### 1.3 Password Reset Flow

- **Students:** Students have no system password — their identity is entirely managed by the **school's Microsoft / Azure AD tenant**. Password resets for students are handled by the school's IT department (via Microsoft's own self-service password reset). The library system has no role in this flow.
- **Librarians / Admins (Local Portal):** A Super Admin initiates a password reset from the local admin panel. The system generates a short-lived reset token (expires 1 hour) stored in the local Postgres DB (hashed). A reset link pointing to the **local intranet URL** is dispatched via **Resend**. The reset page is accessible on the school LAN only. The school's IT department should configure a local DNS record on the school's DNS/DHCP server (e.g., Windows Server DNS or pfSense) as the primary approach for the intranet portal. Broadcasting via **mDNS (Bonjour/Zeroconf)** (e.g., `http://lms.local`) can be used as a secondary convenience, acknowledging that many school Wi-Fi networks have mDNS/Client Isolation enabled which blocks device-to-device mDNS packets.
- **UX:** Staff redirect to the local login page with a clear success toast: _"Password updated successfully. Please log in."_

#### 1.4 User Profile Management

- Students can update: profile picture, contact number. Immutable fields (name, student ID, email) can only be changed by a Librarian or Admin.
- **[NETWORK TOPOLOGY FIX]** Student profile pictures are uploaded via the **public cloud portal** directly to **Supabase Storage** (free 1 GB tier — adequate for profile thumbnails). The upload returns a public URL stored in `users.supabase_avatar_url` in the Supabase Cloud DB. The Sync Worker pulls this URL down to the local `users.supabase_avatar_url` field. The librarian checkout screen fetches this URL to display the student's face for identity verification. Staff profile pictures are uploaded on the local intranet portal and saved to `/uploads/avatars/{userId}.webp` on the local disk.
- **UX:** An image cropper modal (e.g., using `react-image-crop`) pops up to ensure profile pictures fit standard dimensions before upload.
- Account deactivation (soft delete — sets `is_active = false`) by Admin, with a confirmation modal.

---

### Module 2: E-Library Card (Auto-Generation)

**Purpose:** Issue students a digital, scannable library card automatically upon first login.

#### 2.1 Auto-Generation Engine

- **Trigger:** Automatically fires on the student's **first Microsoft OAuth login**, detected by the local PM2 Sync Worker on its next polling cycle (within 5 minutes of first login).
- Generates a **unique card number** (`LIB-YYYY-XXXXXXXX` where XXXX is a zero-padded sequential or random UUID segment) and stores it in `library_cards.card_number`. The QR code is **generated dynamically on the client-side at render time** using the `qrcode` npm package — the card number is the data encoded, no storage upload is required. `library_cards.qr_code_url` is removed from the schema; the card number is the single source of truth.
- Card status defaults to `pending` until a Librarian approves it, preventing library access before identity verification.

#### 2.2 Digital Card Display (Mobile-First)

- Displays: Full Name, Student ID, Card Number, QR Code, Department, Status Badge (`Active` / `Suspended` / `Pending`), Expiry Date, and School branding.
- **UX (Mobile Feature):** A _"Tap to maximize brightness"_ button on the card page uses the Screen Brightness API (or a white overlay layer as a fallback) to ensure QR scanners can reliably read the code in any lighting. Screen reverts to normal brightness when the user navigates away.
- **Download as PNG:** A _"Save as Image"_ button uses `html2canvas` to render the styled card component into a canvas and triggers a browser download as a high-resolution `.png` file — works entirely client-side, zero cost. Before calling `html2canvas`, the component fetches the student's avatar from Supabase Storage as a blob and converts it to a `data:` URL to prevent CORS canvas tainting on cross-origin images.
- **Download as PDF:** A _"Save as PDF"_ button uses `jsPDF` + `html2canvas` to render the same card into a properly sized PDF page and triggers a browser download as a `.pdf` file — works entirely client-side, zero cost. The PDF includes the card on one side, suitable for printing as a physical ID card. _(iOS Safari fallback: open PDF in a new tab via `jsPDF.output('dataurlnewwindow')` since programmatic blob downloads are blocked in mobile Safari.)_
- **UX:** Both download buttons are prominently displayed below the card with icons. A brief loading toast shows while the canvas renders. The downloaded file is named `LibraryCard-{CardNumber}.png` / `.pdf`.

#### 2.3 Card Verification & Approval Workflow

- Librarian sees a paginated queue of `pending` library cards with batch-approve capability.
- **[RISK-05 — Atomic Approval + Email Queue]:** Card approval must wrap both DB writes in a single `prisma.$transaction()`: (1) `UPDATE library_cards SET status = 'active'`, and (2) `INSERT INTO email_queue (...)`. If the process crashes between these writes, the student ends up with an active card but never receives the approval email. Atomic wrapping guarantees either both succeed or both roll back.
- **UX:** Approval triggers an automated email via **Resend** to the student: _"Your library card is now active!"_
- Rejection requires the librarian to select a pre-defined reason (e.g., _"Photo unclear"_, _"Student ID mismatch"_) and optionally add a custom note. This pre-filled reason is included in the rejection email for transparent communication.

#### 2.4 Card Suspension & Expiry

- Librarians can suspend a card (e.g., for unpaid fines exceeding a threshold set in Settings). Suspension is reversible.
- Cards have an expiry date (e.g., academic year end). The **local node-cron daily orchestrator** auto-marks expired cards and dispatches a renewal prompt email via Resend.
- **UX:** A prominent `Suspended` or `Expired` status banner replaces the QR code on the card page, with a link to resolve the issue.

---

### Module 3: Catalog & Inventory Management

**Purpose:** Manage the complete library collection with real-time availability tracking.

#### 3.1 Book Registry (CRUD)

- Create/Edit a book with: Title, Author(s) (multi-value input), ISBN, Publisher, Edition, **Category**, **Tags**, Physical Location (Rack/Shelf), Cover Image, and number of copies.
- **Manual Entry:** Librarians can add books entirely by hand — all fields in the form are directly editable without requiring an ISBN. The ISBN lookup is an optional shortcut, not a requirement. This supports donated books, unlisted titles, and local materials that have no ISBN.
- **ISBN Auto-Fill (Optional):** Open Library API ISBN lookup (`https://openlibrary.org/api/books?bibkeys=ISBN:...`) auto-fills Title, Author, Publisher, and Cover. This reduces data entry errors significantly.
- **Book Location:** Each book record stores a **Rack/Shelf** field (e.g., `Section B – Shelf 3`). This location is displayed prominently on the Book Detail page in the catalog and is included in search results. On mobile, this shows as a highlighted location chip: 📍 _Section B – Shelf 3_. Students and librarians always know exactly where to physically find a book.
- **Book QR Code Labels:** Each individual `book_copies` record has a unique `qr_code` value (generated by `book_copy_qr_seq` PostgreSQL sequence). A _"Print QR Labels"_ button on the Book Detail page opens a **print-ready modal** displaying the QR code for each copy (generated dynamically from `qr_code` using the `qrcode` package), along with the book title and copy number. The librarian can print this page directly (browser print dialog) to produce adhesive QR sticker labels for physical books. No dedicated hardware or external service is required — entirely client-side and free. A single scanner workflow now handles both student cards and book copies.
- Cover images are uploaded directly to the local school server's hard drive (`/uploads/covers`). **Security:** To prevent path traversal attacks or malicious executable uploads, the backend strictly whitelists MIME types (`image/jpeg`, `image/png`, `image/webp`) and **completely strips the original filename**, renaming the file to a server-generated UUID (e.g., `550e8400-e29b-41d4-a716-446655440000.webp`). For the public cloud portal, a lightweight compressed thumbnail is synced to the Supabase free tier bucket and served behind a **Cloudflare Free CDN** to ensure Supabase egress bandwidth limits (2GB/month) are never exhausted.
- **[NETWORK BANDWIDTH FIX]** The local school portal must **not** load book cover images from Supabase Storage URLs. To save school internet bandwidth and Supabase free-tier egress limits, the local portal always serves cover images directly from local disk (`/api/images/covers/[uuid]`). Only the public Vercel portal fetches from Supabase (via Cloudflare).
- **UX:** _"Are you sure you want to delete this book?"_ warning modal explicitly lists any currently active borrows for that book, warning the librarian about orphaned records before proceeding. Deletion is blocked if active borrows exist.
- **[CORRECTION]** `books.available_copies` is a computed value updated via a **native PostgreSQL trigger** on `book_copies.status` changes, ensuring it is always consistent without requiring application-level recalculation.

#### 3.2 Category & Tag Management _(Previously Missing)_

- Super Admin and Librarians can create, edit, and delete categories (e.g., _Science_, _Fiction_, _Thesis_) in the Settings module.
- Books can be tagged with multiple free-form tags for granular discovery (e.g., `#python`, `#climate`, `#local-history`).

#### 3.3 Search & Discovery

- Full-text search across Title, Author, ISBN, and Tags using PostgreSQL `tsvector` / `tsquery`.
- **Local intranet portal:** Full-text search queries run directly against the local PostgreSQL `tsvector` / `tsquery` engine over LAN — sub-millisecond latency makes an additional caching layer unnecessary. **Public cloud portal:** Search results are cached using Next.js native `unstable_cache` (Vercel Data Cache). Cache is explicitly invalidated on catalog sync writes.
- **UX (Mobile-First):** Infinite scrolling on mobile. A sticky _"Filters"_ bottom sheet allows filtering by Category, Availability (Available Now), and Type. Provides an immediate _"No books found"_ empty state with a suggestion to clear filters.

#### 3.4 Section-Based Book Location _(Simplified Discovery)_

**Purpose:** Let students and librarians know which section of the library a book belongs to, using a plain text label — no maps or QR hardware required.

- **Section Label on Books:** Each book record has a `section` field (free-text, e.g., `"Fiction"`, `"Science"`, `"Thesis Corner"`, `"Reference"`). This is set by the librarian when adding or editing a book.
- **Displayed Everywhere:** The section label appears as a plain text chip on every search result row and the book detail page — e.g., 📍 _Fiction Section_. Students immediately know which part of the library to walk to.
- **Filterable:** The search filter sheet includes a _"Section"_ dropdown so students can narrow results to a specific area (e.g., _"Show me only Fiction books that are available now"_).
- **Low Stock Alert:** When `books.available_copies` drops to 0 (triggered by the `update_available_copies` DB trigger), the librarian receives an in-app notification: _"'[Book Title]' has 0 available copies. [N] students are waiting."_ This is an actionable signal to consider acquiring additional copies.
- **"I Can't Find This Book" Report:** On any book's detail page, students can tap an _"I can't find this book"_ button to report a possibly misshelved copy. An optional note can be added. The report appears in the librarian's task inbox for follow-up.

---

### Module 4: Circulation Management (Borrowing, Returning & Renewals)

**Purpose:** The core transactional engine for borrowing, returns, renewals, and reservations.

#### 4.1 Borrowing / Checkout

- Librarian initiates checkout: First scans the Student's QR code (from their digital library card), then scans the book's QR code sticker — all via a **secure WebRTC camera modal** using `html5-qrcode`. A single scanner handles both student cards and book QR labels seamlessly. No specialized external hardware is required.
- **[Scanner Debounce / Anti-Spam]:** The React scanner component enforces a strict 1.5-second processing debounce upon detecting a QR code. This completely prevents a scenario where a trailing scanner reads the same QR code 15 times in a second, which would otherwise flood the API and the `audit_logs` table with identical duplicate checkout/return attempts.
- **[Checkout Context Lock UX]:** To prevent a trailing scan from accidentally switching the active student while a librarian is scanning multiple books, the UI must explicitly enter a "Student Checkout Context" once a library card is scanned. Subsequent scans are strictly evaluated as book barcodes. If another library card is scanned, the UI blocks it with a prompt: _"Complete current checkout first, or click 'Clear' to switch students."_
- **Identity Verification (Security):** To prevent students from bypassing suspensions by presenting a friend's library card, after scanning the QR code the checkout screen prominently displays the card owner's **Student ID Number** (e.g., `20240001`). The librarian verbally asks the student to state their ID. If the spoken ID matches what is shown on screen, identity is confirmed. This is faster than photo comparison, works in poor lighting, and requires zero camera quality assumptions.
- System validates: (1) Student has an `active` library card, (2) No outstanding fines above the configured threshold, (3) Student has not exceeded the max borrow limit (from Settings), (4) The specific book copy is `available`.
- **[CORRECTION]** Borrowing limit is enforced by counting active `borrowing_records` for the user, not by a potentially stale column on the `users` table.
- **[CORRECTION #8 — Concurrent Checkout Race Fix]** The checkout validation must use `SELECT ... FOR UPDATE` on the specific `book_copies` row (locking it for the duration of the transaction) before checking `status = 'available'`. This prevents two simultaneous checkouts from both reading status as `available` before either write commits. Implement this inside a **Prisma `$transaction()` with a raw SQL `SELECT ... FOR UPDATE` query** executed against the local PostgreSQL instance.
- **[RISK-08 — Multi-Librarian Lock Contention]:** When two librarians scan the same book simultaneously, the second transaction will receive a PostgreSQL lock-wait timeout causing a Prisma `P2034` error. This error **must** be caught explicitly at the API route level. Return a structured `409 Conflict` JSON response. The UI maps the 409 to a friendly modal: _"This book copy was just checked out by another session. Please scan a different copy or try again."_ Allowing `P2034` to propagate as an unhandled 500 error is unacceptable UX.
- **[IDEMPOTENCY FIX]:** In a local Wi-Fi environment, connection drops exactly at the moment of clicking "Confirm Checkout" are common. The checkout API must accept an `idempotency_key` (generated by the frontend). If the librarian clicks "Confirm" multiple times due to lag, the backend bypasses the `P2034` lock error and gracefully returns the existing successful transaction response.
- **UX:** A **Borrowing Confirmation Modal** shows the student's name, the book title, the calculated due date, and applicable renewal policy. The librarian clicks "Confirm Checkout" to finalize.

#### 4.2 Return Processing

- Librarian scans the book barcode to initiate a return. The system finds the active `borrowing_record` for that copy.
- System calculates overdue days. If the book is overdue and no `open` violation ticket of type `overdue_return` already exists for this borrowing record, the system **automatically issues a Violation Ticket** (severity: `warning` for 1–3 days overdue, `minor` for 4–7 days, `major` for 8+ days). No monetary values are generated.
- **UX:** The Return Modal immediately informs the librarian of: (1) the book's condition (`Good` / `Damaged`) with an input to update it, and (2) whether a violation ticket was auto-issued, including its severity level and the accumulated ticket count for that student — so the librarian can speak to the student before they leave.
- **[NEW] Book Not Found / Lost Escalation:** If the scanned barcode does not match any `active` borrowing record, the system checks if the book is currently marked as `lost`. If `lost`, it presents a _"Found Lost Book - Re-activate?"_ modal to restore the book to circulation. If it's simply missing a record, it presents a _"Report as Lost"_ action. This sets `book_copies.condition = 'lost'` and `book_copies.status = 'lost'`, automatically issues a `major` severity Violation Ticket for the last borrower (reason: `lost_book`), updates `books.available_copies` via the database trigger, and notifies the last borrower by email and in-app alert.
- **[NEW] Hold Queue Trigger on Return:** When a book is returned successfully, the system checks `book_holds` for any `waiting` holds on the same `book_id`. If a hold exists, the earliest queued student is notified via in-app + email: _"Good news! '[Book Title]' is now available. Please collect it from the library within [N] days."_ The hold status updates to `ready` and `notified_at` is stamped. If the student does not collect within the hold expiry window, the hold is marked `expired` and the next student in queue is notified.

#### 4.3 Book Renewal _(Previously Missing as a dedicated sub-module)_

- **Librarian-Initiated:** Librarian can renew a specific borrowing record from the circulation management panel.
- **Student Self-Service:** Students can renew from their dashboard if: (1) Max renewals (from Settings) have not been reached, (2) The student has no `open` violation tickets of `major` severity.
- Each renewal creates a row in the `renewals` table for auditing and calculates a new `due_date` (current date + loan period from Settings).
- **UX:** A _"Renew"_ button on the student's borrowed books card; a confirmation modal shows the new due date before finalizing.

#### 4.4 Physical Inventory Maintenance _(New)_

- **QR Code Replacement:** If a physical QR code sticker on a book is damaged, faded, or peeling, a dedicated librarian flow permits regenerating and reprinting a new QR sticker for an existing `book_copies` ID. The new QR value is again generated by the `book_copy_qr_seq` sequence to maintain the uniqueness constraint. The complete historical borrowing log for that specific physical unit is fully preserved.

#### 4.5 Book Hold / Reservation Queue _(New)_

- Students can tap **"Place a Hold"** on any book in the catalog that currently has `available_copies = 0`. The system adds them to a `book_holds` queue (FIFO — first requested, first served).
- The student's position in the queue is displayed on their dashboard: _"You are #2 in line for '[Book Title]'. Estimated wait: ~14 days."_ (Estimate is based on the average loan period from Settings.)
- Holds expire automatically if the student does not collect within the configured window. The cron daily job checks for expired holds, marks them `expired`, and notifies the next student in queue.
- **Librarian View:** A _"Holds Queue"_ panel shows all pending holds per book, with the ability to manually assign or cancel a hold (e.g., if the student graduated or withdrew).
- **UX:** A _"Cancel Hold"_ button is available on the student's dashboard at any time.

---

### Module 5: Digital Resources (E-Library) — IN-SCHOOL ONLY

**Purpose:** Provide seamless access to digital content exclusively within the school premises to protect terrestrial copyright and save cloud storage costs.

#### 5.1 Digital Resource Registry

- Admins and Librarians upload heavy PDFs (e-books, journals, theses). Files are saved directly to the **local school server's hard drive** (`/uploads/resources`). This gives the school functionally **infinite free storage** limited only by the physical disk.
- **Security Constraint:** Just like covers, all uploaded PDFs have their original filenames completely stripped and are renamed to a UUID-v4 (e.g., `d9b2d63d.pdf`) upon hitting the local server. This permanently eliminates path traversal and remote shell injection risks on the Node.js server.
- Metadata includes: Title, Author, Category, Type (`ebook` / `journal` / `thesis`), File Size (MB), and Access Level (`public` / `restricted`).
- **UX:** An upload progress bar with file size and estimated time remaining keeps the librarian informed during large uploads. Since it's on a local Gigabit LAN, uploads are nearly instantaneous.

#### 5.2 Digital Reading Experience (Local Network Lock)

- Built-in, mobile-responsive PDF viewer (e.g., `react-pdf`) embedded directly in the local intranet page.
- **[PDF Traversal Defense]:** The local Next.js API route that streams the PDFs from disk out to the browser (`/api/resources/[fileName]`) rigorously sanitizes the input. It uses `path.basename(req.query.fileName)` to strip ALL directory traversal characters (e.g., `../../etc/passwd`). It then ensures the resolved path strictly resides inside the designated `/uploads/resources` folder.
- **[NETWORK FENCE]** The digital reading portal is physically not deployed to the public cloud. Students can only view thesis PDFs by connecting their phones/laptops to the school's Wi-Fi network. The IT department should establish a local DNS record for the intranet portal. A secondary **mDNS (Bonjour/Zeroconf)** broadcast (e.g., `http://lms.local`) can be implemented as a fallback where network topology permits, keeping in mind that client isolation features on APs may block mDNS traffic.
- **Offline PIN Protocol (Blackout Contingency):** If the school's internet connection drops (making Microsoft SSO inoperative), students CANNOT log in to the local portal normally. Instead, they access the intranet URL, select _"Offline Access"_, and are prompted for a 6-digit PIN. The student physically presents their ID to the Librarian, who clicks _"Generate Offline Session"_ on the staff dashboard. This generates a temporary, 2-hour 6-digit numeric PIN, bcrypt-hashed and stored in the `offline_pins` table. **Rate Limiting:** The `/offline-access` API route allows a maximum of **5 incorrect PIN attempts per student_id per 30-minute window**. Given the 2-hour PIN expiry, this limits an attacker to at most 20 attempts per PIN. At 1,000,000 possible combinations, this is a ~1-in-50,000 chance of brute-forcing, which is acceptable severity given the physical gating (student must stand at the desk). After 5 failures: the active PIN is immediately invalidated, the Librarian receives an in-app alert, and the student must physically return to the desk. `used_at` is set on the first successful use to prevent replay attacks.
  - **[RISK-09 — Offline Session Scope Restriction]:** Offline PIN verification must issue an **opaque session token** (stored locally in an `offline_sessions` table) rather than a stateless JWT. Since offline sessions are often granted on shared or BYOD devices, librarians must have the ability to click _"Revoke All Active Offline Sessions"_ instantly if a device is left unattended. **Only `/resources` (PDF reader) is accessible for `offline_student` sessions.** All other routes (`/renew`, `/my-card`, `/profile`, `/borrow`) must immediately redirect to the offline landing page with a message: _"This feature requires an internet connection."_
- **UX:** Remembers the last page read per user per resource via `localStorage`. Provides a floating toolbar for zoom, page jump, and a mobile-friendly bottom seek bar.

---

### Module 6: Violation Ticket System

**Purpose:** Enforce library accountability through a structured, non-monetary disciplinary system. There are no fees or payments — consequences are administrative (warnings, card suspension).

#### 6.1 Ticket Engine (Automated & Manual)

- **Automated Issuance:** The daily cron orchestrator (PM2 + node-cron) is **stateful** — it queries `settings.last_overdue_check_date` on startup and processes all missed days sequentially, ensuring no overdue events are skipped even if the server was offline for a weekend.

  **Sub-task 0 (Prerequisite — Overdue Status Transition):**

  ```sql
  UPDATE borrowing_records
  SET status = 'overdue'
  WHERE status = 'active'
    AND due_date < CURRENT_DATE AT TIME ZONE 'Asia/Manila';
  ```

  **Sub-task 1 — Auto-Issue Violation Tickets:** For each newly overdue `borrowing_record`, if no `open` ticket of type `overdue_return` already exists for that record, insert a new `violation_tickets` row. Severity is determined by days overdue:
  - 1–3 days → `warning`
  - 4–7 days → `minor`
  - 8+ days → `major`

  The `ON CONFLICT DO NOTHING` guard (unique index on `(borrowing_record_id, type)` for `open` tickets) prevents duplicate tickets if the cron fires twice around midnight.

- **Manual Issuance:** Librarians can manually issue a ticket from the student's profile or the circulation panel. Manual tickets require selecting a type (`overdue_return` | `lost_book` | `damaged_book` | `unauthorized_access` | `other`) and writing a mandatory description (minimum 10 characters).

#### 6.2 Grace Period & Ticket Escalation

- **[TIMEZONE SAFETY]** All date comparisons use `AT TIME ZONE 'Asia/Manila'` — never raw UTC. A student returning a book at 8:01 AM local time must not be penalized due to UTC day-boundary mismatch.
- A configurable grace period (default: 1 day, from Settings) buffers minor delays before a ticket is issued.
- **UX:** The student dashboard shows a prominent 🟡 _"Due Tomorrow"_ warning banner. An automated email reminder is sent 1 day before the due date. These reminders are the first line of defense against overdue violations.

#### 6.3 Ticket Lifecycle & Card Suspension

- **Open → Resolved:** A librarian marks a ticket `resolved` at any time (e.g., after a student returns a lost/damaged item or serves a suspension period). A resolution note is mandatory.
- **Open → Dismissed:** A librarian can dismiss a ticket with a mandatory written justification. Dismissals are logged to `audit_logs` with `old_value` / `new_value` for full accountability — a Super Admin can always see who dismissed a ticket and why.
- **Automatic Card Suspension:** If a student's count of `open` tickets reaches the configured threshold (from Settings, e.g., **3 open tickets** or **1 major ticket**), the system automatically sets `library_cards.status = 'suspended'`, blocking all new borrows and renewals. The student receives an in-app + email alert: _"Your library card has been suspended due to [N] unresolved violations. Please visit the library to resolve them."_
- **Reinstatement:** A librarian resolves or dismisses the relevant tickets, then manually reinstates the card (`status = 'active'`). Both actions are logged.
- **Student View:** Students can see all their own violation tickets (type, severity, status, issued date, and resolution notes if resolved/dismissed) in their profile under a _"My Violations"_ tab. Transparent communication is the priority.
- **UX:** Ticket severity is color-coded: ⚪ Warning, 🟡 Minor, 🔴 Major. A ticket count badge appears on the student's profile chip in the librarian dashboard.

---

### Module 7: Student Self-Service Portal

**Purpose:** Empower students to manage all library interactions independently from their phones.

#### 7.1 Mobile-First Dashboard (Home Tab)

- **Bottom Tab Navigation:** Home, Catalog, Scanner (launch camera for self-service check-in at kiosk), My Card, Profile.
- **UX:** _"Traffic Light"_ urgency indicators on borrowed books: 🟢 Green (Safe, > 3 days) → 🟡 Yellow (Due within 3 days) → 🔴 Red (Overdue).
- Summary cards: Active borrows, Open violation tickets (count + highest severity), Unread notifications, Active holds in queue.

#### 7.2 My Borrowing History

- Paginated, sortable list of all past and current borrows with status, due date, returned date, and any associated fines.

#### 7.3 My Notifications

- In-app notification center with categorized tabs: _All_, _Due Date Alerts_, _Fines_, _System_.
- Real-time unread badge counter on the bottom tab. Mark all as read action.

#### 7.4 Self-Service Renewal

- Students can initiate a renewal from the "Active Borrows" section of their dashboard (see Module 4.3 for validation rules).

---

### Module 8: Notifications & Alerts System

**Purpose:** Keep all users informed at the right time through the right channel.

#### 8.1 Notification Triggers (Automated)

| Event                                     | In-App | Email |
| ----------------------------------------- | ------ | ----- |
| Library Card Approved / Rejected          | ✅     | ✅    |
| Book Due in 1 Day (Reminder)              | ✅     | ✅    |
| Book Overdue (Ticket Issued)              | ✅     | ✅    |
| Violation Ticket Issued (Manual)          | ✅     | ✅    |
| Violation Ticket Resolved / Dismissed     | ✅     | ✅    |
| Card Suspended (Ticket Threshold Reached) | ✅     | ✅    |
| Hold Ready for Collection                 | ✅     | ✅    |
| Hold Expired (Not Collected)              | ✅     | ✅    |
| Password Reset Link                       | —      | ✅    |

#### 8.2 Multi-Channel Delivery

- **In-App:** Toast notifications for real-time feedback. Persistent notification center for history. All critical modals for destructive actions.
- **Email:** Sent via Resend API from the local server. If the server loses internet connectivity, emails are written to the dedicated **`email_queue` table** (`status = 'pending'`). **[NETWORK GUARD]** The PM2 node-cron worker performs a fast DNS ping (e.g., to `8.8.8.8`) before querying the queue. If it fails, execution aborts to prevent falsely incrementing the `attempts` counter during multi-day internet blackouts. When online, delivery is retried up to 3 times (logging errors to `last_error`) before marking `'failed'` and alerting the Super Admin via an in-app notification. **To prevent sending stale notifications (e.g., a "Due in 1 Day" reminder that is now 2 days late due to an outage), the flush job must check `email_queue.created_at` and discard time-sensitive emails older than their relevancy window.**
  - **[RISK-14 — Per-Row Email Error Isolation]:** Each email row's Handlebars template render and Resend API call must be wrapped in its own `try/catch`. On render error (e.g., a student with a `NULL` name field causing a template crash): set `status = 'failed'`, set `last_error = 'Template render error: [message]'`, and `continue` to the next row. A single malformed row must never crash the entire nightly batch — all remaining rows must still be processed.
  - **Prerequisite:** The `RESEND_FROM` address requires the sending domain to be verified via DNS records (SPF, DKIM, DMARC) in the Resend dashboard prior to production. If the school doesn't own a custom domain, a Resend-provided subdomain or a purchased domain must be used.
  - **Email Templates (Handlebars):** Required templates include `Welcome_Staff` (with temporary password), `Card_Approved`, and `Overdue_Notice` (with exact fine amount calculation).

---

### Module 9: Reporting & Analytics

**Purpose:** Provide administrators with actionable, data-driven insights.

#### 9.1 Admin Dashboard (Super Admin & Librarian)

- **Key Metrics Cards:** Total active borrows today, Total overdue, Total collected fines (month), New registrations (week).
- **Charts (using Recharts or Chart.js):**
  - Borrowing trend by week/month (line chart)
  - Top 10 most-borrowed books (horizontal bar)
  - Most popular categories (pie/donut chart)
  - Fine collection trend (area chart)
- **Live Local Analytics:** Because the primary PostgreSQL database runs locally on the extremely fast LAN without facing thousands of public internet requests, aggregation/analytical caching holds no value. The dashboard executes **real-time native SQL `COUNT()` / `SUM()` aggregation queries** on initial load, guaranteeing the Librarian's dashboard metrics are perfectly up-to-the-second.
- Librarians see a simplified version (no financial KPIs).

#### 9.2 Exportable Reports

- Export borrowing history, fine summaries, and user activity as **CSV** (for Excel compatibility) or **PDF** reports.
- Date range filtering for all reports.

#### 9.3 Audit & Compliance Logs (Super Admin Only)

- Immutable `audit_logs` table records: actor, action, target record, old value (JSON), new value (JSON), IP address, and timestamp.
- Covers: any deletion, fine waiver, configuration change, and admin role grant.
- Filterable and exportable as CSV. Logs are **never editable or deletable** even by Super Admin. **[RISK-04]** This is enforced at the PostgreSQL level via `REVOKE DELETE, UPDATE, TRUNCATE ON audit_logs FROM lms_app_user;` AND a `BEFORE DELETE OR UPDATE` trigger (partition-propagation safe) — see schema section for full SQL. `CREATE RULE` is explicitly **not used** as rules do not propagate to partition children. The `audit_logs` table exists exclusively on the local server and is never synced to the public cloud DB.

---

### Module 10: Settings & System Configuration

**Purpose:** UI-driven management of library policies without requiring code changes.

#### 10.1 Policies & Thresholds

| Setting Key                   | Description                                                       | Default |
| ----------------------------- | ----------------------------------------------------------------- | ------- |
| `max_borrow_limit`            | Max books a student can borrow simultaneously                     | 3       |
| `default_loan_period_days`    | Default return window from checkout date                          | 14      |
| `max_renewals_per_book`       | Max times a book can be renewed                                   | 2       |
| `violation_grace_period_days` | Days before an overdue ticket is auto-issued after due date       | 1       |
| `ticket_suspension_threshold` | Number of open tickets that triggers automatic card suspension    | 3       |
| `major_ticket_auto_suspend`   | A single `major` ticket triggers automatic card suspension        | `true`  |
| `hold_expiry_days`            | Days a student has to collect a book after a hold becomes `ready` | 3       |
| `card_validity_years`         | Library card validity period in years                             | 1       |

- **UX:** Each setting has a helper subtext explaining its cascading impact on user behavior. Changes require a confirmation modal before saving.
- All setting changes are written to `audit_logs` with the old and new values for full accountability.
- **[RISK-12 — Card Expiry Retroactive Recompute]:** Changing `card_validity_years` in Settings does **not** retroactively update the `expires_at` timestamps on already-issued `library_cards` (they are baked at issue time). A _"Recompute Expiry Dates"_ button must be provided next to this setting. Clicking it opens a confirmation modal: _"This will update the expiry date of all [N] active library cards based on their `issued_at` + the new policy. This cannot be undone."_ Confirming triggers a batch `UPDATE library_cards SET expires_at = issued_at + interval '[N] years' WHERE status = 'active'`.
- **[RISK-13 — Over-Limit Policy Violation Indicator]:** If `max_borrow_limit` is reduced while students already hold more books than the new limit, those students will not be blocked from returning books but will be silently "over-limit." The librarian's Student Detail view must display a yellow badge: _"Over current borrow limit — no new checkouts or renewals permitted until books are returned."_ This is evaluated in real-time on every page render by comparing `active_borrows_count` against the current setting value.

#### 10.2 Data Retention & Erasure Policy _(New)_

- **Retention Period:** User records and associated borrowing history are retained for **2 years after the user's last activity** (last borrow, login, or fine payment).
- **Hard Delete (Right to Erasure):** A Super Admin can trigger a hard delete of a student record. To comply with GDPR/CCPA privacy laws, the associated `audit_log` and `data_erasure_log` entries are completely anonymized.
- **[CORRECTION — FK & Privacy Integrity]:** `audit_logs.actor_id` (and similar user tracking fields in `borrowing_records` and `fines`) are **nullable UUID Foreign Keys**. On erasure, they are set to `NULL` (`ON DELETE SET NULL`). The non-nullable `actor_display_name` text column (originally e.g., `"John Doe (Student)")` **MUST** also be scrubbed/anonymized to something like `"Deleted Student User (ID: X)"` during the deletion transaction. The same anonymization logic must be applied to `data_erasure_log.subject_user_display_name`. This protects PII while preserving the financial and statistical integrity of the historical audit log.

#### 10.3 Account Deactivation & Yearly Graduation Cleanup

- **Immediate Deactivation:** Admin sets `users.is_active = false` and `library_cards.status = 'expired'` for an individual student at any time (e.g., disciplinary action, withdrawal).
- **Yearly Graduation Batch Action:** At the start of each new school year, the Super Admin clicks _"Run Graduation Cleanup"_ in the Admin panel. The system calls the **Microsoft Graph API** (free, no license required — uses the same Azure AD App Registration already configured for student OAuth) to fetch all user accounts from the school's Azure AD tenant. **[RISK-11 — Pagination Required]:** The Graph API paginates results using `@odata.nextLink` tokens (default page size: ~100 users). The implementation must follow a `while (nextLink)` loop to collect _all_ pages before comparing against local `users.supabase_uid`. Failure to paginate means only the first ~100 users are evaluated; a school with 2,000+ students silently leaves 95% of graduated students with valid library cards. Any `supabase_uid` in the local `users` table that is no longer present (or is disabled) in Azure AD is automatically flagged: `is_active = false`, `library_cards.status = 'expired'`. The Super Admin sees a preview list of affected accounts and must confirm before the batch applies.
- All erasure actions are logged to the immutable `data_erasure_log` table.

---

### Module 11: Operations, Maintenance & Scalability

**Purpose:** Ensure long-term stability and health of the local server infrastructure.

#### 11.1 PM2 Operations & Local Disk Capacity

- **Problem:** Left running indefinitely on a local machine, PM2 stdout/stderr logs and the PostgreSQL `audit_logs` table will eventually consume the entire SSD, bringing the server crashing down years from now.
- **Resolution:**
  - Install and configure `pm2-logrotate` natively (`pm2 install pm2-logrotate`) to strictly cap application log files to 10MB, retaining only the last 14 days.
  - Implement PostgreSQL Table Partitioning by Year on the `audit_logs` table. This allows the school IT to easily dump, archive to external HDD, and cleanly drop partitions that are > 5 years old without invoking a massive, locking `DELETE` statement.

#### 11.2 API Key Security & Rotation Runbook

- **Exposure Risk:** Both the Supabase `service_role` key and the `RESEND_API_KEY` reside in the `.env` file on the physical local server (secured via `chmod 600`).
- **Rotation Plan:** If the physical server is compromised, or untrusted personnel gain shell access, a key rotation runbook must be invoked immediately:
  1. Generate new keys in the Supabase and Resend dashboards.
  2. Update `.env` on the local server and restart the Node service (`pm2 restart lms`).
  3. Revoke the old keys in the respective provider dashboards.

---

## 5. Implementation Phases

### Phase 1: Local Server Setup & DB Foundation (Weeks 1–2)

- [ ] Provision the local school server (e.g., Linux Mini PC) with Node.js, PM2, and local PostgreSQL instance.
- [ ] Set up Prisma schema with all tables, indexes, and constraints. Establish migration workflow.
- [ ] Build the Next.js Intranet App (Librarian/Admin operations).
- [ ] Configure local auth for staff.

### Phase 2: Hybrid Cloud Sync & Public Portal (Weeks 3–4)

- [ ] Set up Supabase Free Tier for the public-facing DB.
- [ ] Build the Data Sync Worker (Node.js + PM2) to push catalog/card data from Local DB to Supabase Cloud DB. **Cost Control:** Worker polls Supabase for student profile completions every **5 minutes** (and hard DELETEs them post-read) to avoid hitting free-tier database API limitations.
- [ ] Initialize the Vercel-hosted Public Portal for students (Mobile-First baseline).
- [ ] Implement Supabase Auth for student login on the public portal.

### Phase 3: Catalog, Inventory & Local E-Library (Weeks 5–6)

- [ ] Book CRUD on the local portal with local disk upload for cover images.
- [ ] Digital resource (PDF) local upload and in-network `react-pdf` viewer.
- [ ] Sync engine pushes a read-only mirror of the catalog to the cloud portal.
- [ ] Public portal catalog search with local `unstable_cache` (Vercel native free caching, replacing Redis).

### Phase 4: Circulation Flow (Weeks 7–8)

- [ ] `html5-qrcode` integration for in-browser, device-agnostic QR/barcode scanning modal.
- [ ] Checkout validation logic (borrow limit, fines threshold, card status) & Confirmation Modals.
- [ ] Return processing with on-the-spot fine calculation modal.
- [ ] Book Renewal (librarian-initiated & student self-service) with `renewals` table auditing.

### Phase 5: Fines & Digital Resources (Weeks 9–10)

- [ ] Local **node-cron daily orchestrator** (PM2-managed) — idempotent fine processing with unique index on `(borrowing_record_id, DATE(created_at))`. **Handling:** To prevent batch crashes if the cron fires twice around midnight (e.g., PM2 restart), the insert logic must explicitly use `ON CONFLICT DO NOTHING` to gracefully ignore unique constraint violations.
- [ ] Fine payment & waiver modals with `fine_transactions` logging.
- [ ] Auto-card-suspension on fine threshold breach.
- [ ] Digital resource upload to local disk (`/uploads/resources`) with MIME whitelist (PDF/EPUB only), **filename stripping mapped to UUIDs**, and metadata stored in local DB.
- [ ] In-page PDF viewer (`react-pdf`) serving files from local disk — accessible on school Wi-Fi only (no public cloud URL generated).

### Phase 6: Student Self-Service Portal & Notifications (Week 11)

- [ ] Full student dashboard with traffic-light indicators, borrow history, and self-service renewal.
- [ ] Multi-channel notification system: in-app notification center + **Email (Resend API)** triggers for all events in the notification trigger table. Emails are written to the dedicated `email_queue` table (with standard retry logic) and flushed on network reconnect if the server is offline.
- [ ] Automated 1-day-before-due reminder email dispatched by the **local node-cron daily orchestrator**.

### Phase 7: Analytics, Reports & Settings (Week 12)

- [ ] Admin metrics dashboard with Recharts (KPI cards + trend charts).
- [ ] CSV and PDF report export with date-range filters.
- [ ] Immutable Audit Log viewer (Super Admin only).
- [ ] System Settings UI with all configurable policy keys and change audit.

### Phase 8: Hardening & Deployment (Weeks 13–14)

- [ ] Unit & integration tests with Vitest for all Server Actions and utility functions.
- [ ] E2E tests with Playwright: checkout flow, fine calculation.
- [ ] PWA offline caching validation (catalog page, digital card, offline banner UX).
- [ ] Security review: RLS policies on Supabase Cloud DB, Zod schema coverage, **local file-serving route authorization (verify JWT before streaming `/uploads/` paths)**, Cron secret headers.
- [ ] Deploy to Vercel (Production). Configure Sentry for error tracking and performance alerting. **[VERCEL BILLING FIX]:** Vercel's free tier has a strict boundary of 1,000 source images for their built-in Image Optimization. A school library with 5,000 books will exhaust this limit and incur surprise billing. The public portal's `next.config.js` **must** disable default image optimization for the `images: { unoptimized: true }` domain to guarantee the project remains 100% free indefinitely.
- [ ] Load test critical endpoints (auth, checkout): **Local intranet portal** — target 10 concurrent librarian sessions (realistic peak); **Public cloud portal (Vercel)** — target 500 concurrent student browsing sessions (protected by Vercel edge network).
- [ ] Configure local server backup: daily automated `pg_dump` to an external USB drive or NAS, with 7-day rolling retention. **[RISK-06 — Backup Integrity Verification]:** After each dump, the output must be compressed with `gzip` and its SHA256 hash appended to a `backup_manifest.txt` on the NAS. A separate weekly PM2 cron must perform a dry-run `pg_restore --list` of the latest dump and log the result to the `cron_run_log` table. A corrupt/truncated dump that is never verified will appear valid until disaster recovery is attempted. Document full recovery runbook in `.docs/disaster-recovery.md`.
- [ ] Validate local **node-cron daily orchestrator** runs all 3 sub-tasks successfully: (1) fine processing, (2) 1-day-before-due reminders, (3) quarterly inactive-user flag. Confirm via PM2 logs and a `cron_run_log` table entry per execution.

---

## 6. Success Criteria & KPIs

| Metric                               | Target                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| Public Portal Load Time (Mobile, 3G) | < 3 seconds (LCP) via Vercel Edge Cache                       |
| Local Intranet Response Time         | < 50ms over school gigabit LAN                                |
| Storage Cost & Scalability           | 0 / Infinite (leveraging physical hard drives for PDFs)       |
| Cloud Sync Latency                   | Updates to cloud catalog reflected within < 5 minutes         |
| Background Task Reliability          | 100% execution success on native Node-Cron (no Vercel limits) |
| E-Library Card Generation Time       | < 5 seconds after admin approval                              |
| Checkout Processing Time (with scan) | < 10 seconds end-to-end                                       |
| Test Coverage                        | ≥ 80% unit/integration coverage via Vitest                    |
| Error/Crash Rate in Production       | < 0.1% of sessions (monitored via Sentry)                     |
