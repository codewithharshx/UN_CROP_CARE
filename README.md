# UN CROP CARE — Biotechnology & Organic Agriculture Solutions

> **"शेतकऱ्यांच्या सेवेसाठी सदैव तत्पर"** | **"Working Together, Prosper Together"**

A high-performance modern web platform and management portal for **UN CROP CARE**, a premier biotechnology company based in Maharashtra, India, dedicated to organic farming solutions, soil nourishment, and sustainable crop productivity.

---

## 🌾 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start/latest) (Full-stack React 19 SSR with type-safe routing)
- **Runtime & Package Manager**: [Bun](https://bun.sh) (v1.4.4)
- **Language**: TypeScript 5.9
- **Database & ORM**: PostgreSQL 18 with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Better Auth](https://better-auth.com) (Secure Argon2/scrypt password hashing & session management)
- **Authorization**: Comprehensive Role-Based Access Control (RBAC) supporting 7 staff roles
- **Styling**: Tailwind CSS with Radix UI primitives & Lucide Icons
- **Production Server**: Nitro (Vercel Build Output API v3 runtime)
- **Storage Layer**: Pluggable storage architecture (Local Disk for development, Vercel Blob for cloud serverless deployments)

---

## 🚀 Key Features

1. **Brand Identity & Organic Product Catalog**:
   - High-fidelity product pages for all 8 signature formulations:
     - **Soil Super Organic Carbon** (Granules & Powder)
     - **Volvo Super** (Plant Vitalizer & Bio-stimulant)
     - **Martin Gold** (Soil Conditioner & Yield Enhancer)
     - **Robust** (Bio-fungicide & Crop Shield)
     - **Recover** (Stress Recovery & Nutrient Booster)
     - **UN-Zyme** (Multi-enzyme Bio-extract)
     - **UN-SAF** (Specialized Crop Nutrition)
   - Real farm field gallery and customer testimonial showcases.

2. **Public Enquiry & Dealership Application Engine**:
   - Interactive product enquiry drawer with direct PostgreSQL persistence.
   - Comprehensive multi-step dealership application with region, experience, and business registration fields.
   - Dual-layer anti-spam protection: invisible honeypot fields and in-memory rate limiting.

3. **Staff & Super Admin Management Portal**:
   - Secure staff authentication with session invalidation and password rotation.
   - RBAC privilege enforcement across 7 distinct organizational roles:
     - `super_admin`, `admin`, `sales_manager`, `agronomist`, `support_lead`, `inventory_manager`, `dealer_coordinator`.
   - Real-time review and status updates for customer enquiries and dealer applications.

4. **Security & Production Hardening**:
   - Zero hardcoded credentials in source control; strict `.gitignore` isolation.
   - Least-privilege PostgreSQL role configuration (`uncropcare_app` without superuser or dangerous DDL flags).
   - SQL injection prevention via Drizzle ORM parameterized queries.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.2+) or Node.js (v20+)
- PostgreSQL 16+ running locally on port 5432

### 2. Clone and Install
```bash
git clone https://github.com/codewithharshx/UN_CROP_CARE.git
cd UN_CROP_CARE
bun install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your local database credentials:
```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://uncropcare_app:your_secure_password@127.0.0.1:5432/uncropcare
BETTER_AUTH_SECRET=generate_a_random_32_byte_hex_or_base64_secret_key
BETTER_AUTH_URL=http://localhost:3000
PORT=3000
STORAGE_DRIVER=local
```

### 4. Database Migrations & Seeding
```bash
# Push schema migrations
bun x drizzle-kit migrate

# Verify database connection
bun run scripts/verify-db-connection.ts
```

### 5. Running the Application
```bash
# Start local development server
bun run dev

# Run test suite (25 comprehensive unit and integration tests)
bun test

# Production build
bun run build
```

---

## 🌐 Production Deployment (Vercel)

This application is built with Nitro and natively targets Vercel Serverless Functions:

1. **Connect Repository**: Import `https://github.com/codewithharshx/UN_CROP_CARE` into Vercel.
2. **Build Settings**:
   - Framework Preset: **Other** / Nitro (Automatically detected)
   - Build Command: `bun run build`
   - Output Directory: Automatically handled via `.vercel/output`
3. **Environment Variables**:
   - `DATABASE_URL`: Hosted PostgreSQL connection string (Neon, Railway, AWS RDS) with `?sslmode=require`
   - `BETTER_AUTH_SECRET`: Strong 32-byte production secret
   - `BETTER_AUTH_URL`: Your production domain (e.g., `https://un-crop-care.vercel.app`)
   - `NODE_ENV`: `production`
   - `STORAGE_DRIVER`: `vercel-blob`
   - `BLOB_READ_WRITE_TOKEN`: Token obtained from Vercel Blob storage store

---

## 📄 License & Ownership

Copyright © 2026 **UN CROP CARE**. All rights reserved.
Official contact: `info@uncropcare.in` | `+91 788 732 7272` | [uncropcare.com](http://www.uncropcare.com/)
