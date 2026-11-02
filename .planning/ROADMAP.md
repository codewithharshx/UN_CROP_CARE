# UN CROP CARE — Migration Roadmap

## Phase 1: Preflight, Data Preservation & Foundation (COMPLETED)
- [x] Inspect local toolchain (PostgreSQL 18.4, Node.js 22, Bun 1.4.4).
- [x] Preflight Supabase export & archive initial seed data to `data-backup/`.
- [x] Initialize GSD planning (`.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md`).
- [x] Design comprehensive Drizzle schema (`drizzle/schema.ts`) for all 15 tables + Better Auth tables.
- [x] Create database connection module (`src/lib/db.ts`) with connection pooling and dev/prod isolation.
- [x] Apply least-privilege security hardening on role `uncropcare_app` (`rolsuper=false`).
- [x] Generate initial Drizzle PostgreSQL migration metadata (`drizzle/migrations/0000_initial_pg.sql`).
- [x] Create pre-migration pg_dump backup in `data-backup/`.
- [x] Execute Drizzle migration against database `uncropcare`.
- [x] Verify all 15 tables, 4 enums, sequences, and 8 seed products.
- [x] Verify tests pass and production build succeeds.

## Phase 2: Authentication with Better Auth & 7 Staff Roles RBAC (COMPLETED)
- [x] Install Better Auth and configure Drizzle adapter (`src/lib/auth.ts`).
- [x] Define 7 staff roles (`super_admin`, `business_admin`, `manager`, `accountant`, `sales_executive`, `inventory_manager`, `billing_staff`) and permission matrix (`src/lib/rbac.ts`).
- [x] Build secure one-time bootstrap CLI script (`scripts/bootstrap-super-admin.ts`).
- [x] Mount Better Auth handlers in server entry (`src/server.ts`).
- [x] Update route guards (`src/routes/_authenticated/route.tsx`).
- [x] Update `/auth` login page to authenticate via Better Auth with Google button and clear staff assignment notice.
- [x] Create test suite `src/test/auth-rbac.test.ts` (10/10 tests pass).

## Phase 3: Server Functions & Form Migration (COMPLETED)
- [x] Migrate `listProducts` and `getProduct` to direct Drizzle queries.
- [x] Migrate `submitEnquiry`, `submitDealer`, `submitContact` with Zod validation, honeypot spam protection, rate limiting, and database transactions.
- [x] Implement in-memory rate limiting for form submissions.
- [x] Create `src/lib/admin.functions.ts` with staff session checks and audit logging for enquiries, dealer applications, messages, and products.
- [x] Update Admin dashboard tab queries (`admin.tsx`) to use backend functions.
- [x] Create test suite `src/test/phase3-server-functions.test.ts` (9/9 tests pass).

## Phase 4: Local Storage Adapter & File Uploads (COMPLETED)
- [x] Implement `StorageAdapter` interface and `LocalStorageAdapter` (`src/lib/storage/adapter.ts`).
- [x] Add 5MB limit, MIME type whitelist, crypto random naming, and path-traversal protection.
- [x] Create test suite `src/test/storage.test.ts` (4/4 tests pass).

## Phase 5: Supabase Scrubbing & Verification (COMPLETED)
- [x] Remove `@supabase/supabase-js` from `package.json`.
- [x] Delete `src/integrations/supabase/` and `supabase/` folders.
- [x] Confirm zero remaining Supabase imports across codebase.
- [x] Full test suite (23/23 tests pass across 4 suites).
- [x] Production build (`bun run build`) succeeds cleanly with zero errors.
