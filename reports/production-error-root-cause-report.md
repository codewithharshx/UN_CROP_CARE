# UN CROP CARE — PRODUCTION ERROR ROOT CAUSE REPORT

**Date**: November 2, 2026  
**Investigator**: Senior Full-Stack Engineer, Database Architect & Vercel Specialist  
**Live Production URL**: [https://un-crop-care.vercel.app](https://un-crop-care.vercel.app)  
**Target Repository**: [https://github.com/codewithharshx/UN_CROP_CARE.git](https://github.com/codewithharshx/UN_CROP_CARE.git)  

---

## 1. Executive Summary & Live Proof

The production deployment at `https://un-crop-care.vercel.app` returns an **HTTP 500 Internal Server Error** with the runtime error message:

```text
"This page didn't load. Something went wrong on our end."
```

By querying the live dehydrated SSR stream directly from `https://un-crop-care.vercel.app`, the exact failing operation was captured:

```javascript
// Captured directly from https://un-crop-care.vercel.app SSR payload:
$R[12] = {
  i: " ",
  u: 1793639763349,
  s: "error",
  e: $R[13] = new Error("Failed query: select \"id\", \"slug\", \"name\", \"category\", \"short_description\", \"description\", \"pack_sizes\", \"image_url\" from \"products\" where (\"products\".\"status\" = $1 and \"products\".\"is_public\" = $2) order by \"products\".\"sort_order\" asc\nparams: published,true"),
  ssr: true
}
```

---

## 2. Technical Codebase Audit

### 1. Database Library and PostgreSQL Driver
- **ORM**: `drizzle-orm` (v0.45.1)
- **Driver**: `postgres` (`postgres.js` v3.4.7)
- **Database Engine**: PostgreSQL 18 (Local) / PostgreSQL 16+ (Hosted)
- **Client Configuration** (`src/lib/db.ts`):
  - Configured with `prepare: false` for compatibility with transaction poolers (PgBouncer, Neon poolers).
  - Configured with auto-SSL (`ssl: "require"`) for non-local production hosts.

### 2. Required Production Environment Variables
| Variable Name | Required | Current Status in Vercel | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **CRITICAL** | **NOT CONFIGURED** | PostgreSQL connection URI (`postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require`) |
| `BETTER_AUTH_SECRET` | **CRITICAL** | **NOT CONFIGURED** | 32+ byte cryptographic secret for Better Auth session signing and password encryption |
| `BETTER_AUTH_URL` | **CRITICAL** | **NOT CONFIGURED** | Base URL (`https://un-crop-care.vercel.app`) for auth callbacks and CORS origin verification |
| `NODE_ENV` | Standard | Set by Vercel (`production`) | Production runtime mode |
| `STORAGE_DRIVER` | Recommended | Defaults to local | Set to `vercel-blob` when Vercel Blob store is attached |
| `BLOB_READ_WRITE_TOKEN` | Optional | Auto-injected by Vercel | Token for persistent media uploads via Vercel Blob CDN |

### 3. Expected PostgreSQL Schema
- **15 Tables**:
  - Auth: `users`, `sessions`, `accounts`, `verifications`, `user_roles`
  - Products: `products`, `product_categories`, `product_images`
  - Public Submissions: `enquiries`, `enquiry_items`, `dealer_applications`, `contact_messages`
  - System: `audit_logs`, `business_settings`, `gallery_images`
- **4 Custom PostgreSQL Enums**:
  - `public.product_status`: `'draft'`, `'published'`, `'archived'`
  - `public.enquiry_status`: `'New'`, `'Contacted'`, `'Quotation Sent'`, `'Negotiation'`, `'Approved'`, `'Converted to Order'`, `'Rejected'`, `'Closed'`
  - `public.submission_status`: `'New'`, `'Reviewed'`, `'In Progress'`, `'Archived'`
  - `public.staff_role`: `'super_admin'`, `'business_admin'`, `'manager'`, `'accountant'`, `'sales_executive'`, `'inventory_manager'`, `'billing_staff'`

### 4. Existing Migration Files
- `drizzle/migrations/0000_initial_pg.sql`: Complete DDL creating all 4 enums, 15 tables, foreign keys, unique constraints, and indexes.
- `drizzle/migrations/meta/_journal.json`: Drizzle Kit migration journal tracking `0000_initial_pg`.
- `drizzle/migrations/meta/0000_snapshot.json`: Schema snapshot metadata.

### 5. Product Query Implementation
In `src/lib/public.functions.ts`:
```typescript
export async function getPublicProducts() {
  const rows = await db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      category: schema.products.category,
      short_description: schema.products.shortDescription,
      description: schema.products.description,
      pack_sizes: schema.products.packSizes,
      image_url: schema.products.imageUrl,
    })
    .from(schema.products)
    .where(and(eq(schema.products.status, "published"), eq(schema.products.isPublic, true)))
    .orderBy(asc(schema.products.sortOrder));

  return rows;
}
```

### 6. Is the Database Required During Initial Rendering?
**Yes, in the current design:**
1. In `src/routes/index.tsx` (the root route `/`):
   ```typescript
   loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery)
   ```
2. In `src/routes/products.index.tsx` (the catalog route `/products`):
   ```typescript
   loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery)
   ```
3. In `src/routes/products.$slug.tsx` (the detail route `/products/$slug`):
   ```typescript
   loader: async ({ context, params }) => {
     const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
     if (!p) throw notFound();
     await context.queryClient.ensureQueryData(productsQuery);
     ...
   }
   ```

Because `ensureQueryData(productsQuery)` executes on the server inside the route loader during SSR:
- If the database query throws an error, the loader rejects without catching it.
- TanStack Start propagates the uncaught rejection to `src/routes/__root.tsx`.
- The root `ErrorComponent` replaces the entire page with:
  *"This page didn't load. Something went wrong on our end."*
- Consequently, the **entire website crashes**—even static sections like Hero, About, Gallery, Dealer Information, and Contact details that do not require database data!

### 7. Incorrect Assumptions About Production Environment
1. **Fallback DATABASE_URL Assumption**:
   `src/lib/db.ts` falls back to `postgresql://postgres:postgres@localhost:5432/uncropcare`.
   In local development, a local PostgreSQL service is running. On Vercel serverless containers, `localhost:5432` does not exist. An ephemeral container attempting to connect to `127.0.0.1:5432` immediately throws `connect ECONNREFUSED` or hangs until timeout.
2. **Missing Production Database Configuration**:
   The Vercel project has zero environment variables configured. No remote hosted PostgreSQL connection string has been supplied.

### 8. Vercel Serverless Runtime Characteristics
1. **Ephemeral Execution**: Serverless functions spin up and down on demand. Any database connection must support fast connection establishment or pooling.
2. **Connection Starvation**: Without transaction pooling or limiting connection counts, hundreds of concurrent serverless invocations can exhaust PostgreSQL connection limits.
3. **No Local Persistence**: The `/public/uploads` directory cannot be written to or persisted in serverless containers; cloud blob storage (`@vercel/blob`) is needed for runtime user uploads.

---

## 3. Two-Pillar Solution Architecture

To completely eliminate the production runtime failure and ensure high availability:

### Pillar 1: Fault-Tolerant, Non-Crashing SSR (Code-Level Hardening)
1. **Resilient Public Queries**:
   Wrap `getPublicProducts()` and `getPublicProductBySlug()` in `src/lib/public.functions.ts` with structured error handling. If the database is momentarily down or unconfigured, log the incident securely on the server (redacting sensitive credentials) and return an empty array or controlled status rather than throwing an uncaught exception that crashes SSR.
2. **Graceful UI Fallbacks**:
   - In `src/routes/index.tsx`, when `products.length === 0`, display a polished, brand-aligned fallback:
     *"Our certified organic product catalogue is currently updating. Please explore our gallery or contact our agricultural team directly on WhatsApp for full specifications and pricing."*
   - In `src/routes/products.index.tsx`, display a friendly empty/maintenance state with a WhatsApp/phone contact CTA.
   - The entire website shell (Header, Navigation, Hero, Story, Quality Pillars, Field Gallery, Footer, Contact Drawer) remains **100% operational**.

### Pillar 2: Production PostgreSQL Provisioning & Migrations
1. Connect a hosted PostgreSQL instance (e.g., Neon serverless PostgreSQL with connection pooling & SSL).
2. Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NODE_ENV=production` in the Vercel project.
3. Run the existing migration `drizzle/migrations/0000_initial_pg.sql` against the production database to create all 15 tables and 4 enums.
4. Run the seed script to populate the 8 verified products and image records.
