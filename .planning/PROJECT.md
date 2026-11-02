# UN CROP CARE — PostgreSQL & Better Auth Migration Project
**Mode**: Website Migration & Backend Overhaul
**Created**: 2026-11-02
**Target Stack**:
- Runtime: Node.js (via Nitro Node-Server preset)
- Database: Standalone PostgreSQL 18
- ORM: Drizzle ORM + postgres.js driver
- Auth: Better Auth with Drizzle PostgreSQL adapter
- Validation: Zod
- Storage: LocalStorageAdapter (with S3-compatible interface)

## Migration Goals
1. Complete removal of `@supabase/supabase-js` and all Supabase client/server modules.
2. Direct PostgreSQL connection using Drizzle ORM.
3. Replace Supabase Auth with Better Auth (PostgreSQL-backed sessions, RBAC for 7 staff roles, one-time bootstrap CLI).
4. Replace existing server functions (`submitEnquiry`, `submitDealer`, `submitContact`, `listProducts`, `getProduct`, admin product management).
5. Preserve 100% of website pages, branding, Marathi content, and SEO.

