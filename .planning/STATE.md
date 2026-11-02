# UN CROP CARE — Migration State

## Current Phase: Complete (Phases 1 through 5 Completed)
- **Status**: PRODUCTION READY & FULLY VERIFIED
- **Database**: `uncropcare` on PostgreSQL 18.4 (`127.0.0.1:5432`)
- **Role**: `uncropcare_app` (Least privilege verified: `rolsuper=false`, `rolcanlogin=true`, `rolcreatedb=false`, `rolcreaterole=false`)
- **Backend Architecture**:
  - Standalone PostgreSQL 18.4
  - Drizzle ORM + postgres.js
  - Better Auth + Google OAuth provider + Rate Limiting
  - 7 Staff Roles RBAC (`super_admin`, `business_admin`, `manager`, `accountant`, `sales_executive`, `inventory_manager`, `billing_staff`)
  - Server Functions (`public.functions.ts` & `admin.functions.ts`) with Zod validation, honeypot spam protection, and database transactions
  - Storage Adapter (`LocalStorageAdapter`) with 5MB quota, MIME checking, and path-traversal prevention
- **Database Objects**:
  - 15 Tables: `accounts`, `audit_logs`, `business_settings`, `contact_messages`, `dealer_applications`, `enquiries`, `enquiry_items`, `gallery_images`, `product_categories`, `product_images`, `products`, `sessions`, `user_roles`, `users`, `verifications`.
  - 4 Custom Enums: `enquiry_status`, `product_status`, `staff_role`, `submission_status`.
  - 1 Sequence: `enquiry_seq`.
  - 8 Seed Products: All 8 core agricultural products active with zero duplicates.
- **Supabase Scrubbing**:
  - 100% removed (`@supabase/supabase-js`, `src/integrations/supabase/`, `supabase/`). Zero references in codebase.
- **Safety**:
  - Other local databases (`Smartfinance`, `FINTECH`, `mane_bazar`, `portfolio_db`) and role `postgres` 100% untouched.
- **Verification**:
  - Test Suite: 23/23 tests passing (`bun test`).
  - Production Build: `vite build` succeeds in ~1.15s.
