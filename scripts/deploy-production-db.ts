// UN CROP CARE: Production Database Migration & Verification Helper
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import * as schema from "../drizzle/schema";

async function main() {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    console.error("ERROR: DATABASE_URL environment variable is required.");
    console.error("Example: DATABASE_URL='postgresql://user:password@ep-xyz.neon.tech/uncropcare?sslmode=require' bun run scripts/deploy-production-db.ts");
    process.exit(1);
  }

  // Redact credentials for logging
  const redacted = connectionUrl.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@");
  console.log("==================================================");
  console.log("UN CROP CARE — Production Database Migration");
  console.log("Target Database:", redacted);
  console.log("==================================================");

  const client = postgres(connectionUrl, {
    max: 2,
    connect_timeout: 10,
    prepare: false,
    ssl: connectionUrl.includes("localhost") || connectionUrl.includes("127.0.0.1") ? undefined : "require",
  });

  const db = drizzle(client, { schema });

  try {
    // 1. Connection check
    console.log("\n1. Verifying database connection...");
    const [connInfo] = await client<Array<{ current_user: string; current_database: string; version: string }>>`
      SELECT current_user, current_database(), version();
    `;
    console.log(`[PASS] Connected as user: '${connInfo?.current_user}' on database: '${connInfo?.current_database}'`);

    // 2. Run Drizzle Migrations
    console.log("\n2. Applying migrations from drizzle/migrations folder...");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle", "migrations");
    await migrate(db, { migrationsFolder });
    console.log("[PASS] Schema migrations applied successfully!");

    // 3. Verify Required Tables
    console.log("\n3. Verifying required application tables...");
    const requiredTables = [
      "users",
      "sessions",
      "accounts",
      "verifications",
      "user_roles",
      "products",
      "product_categories",
      "product_images",
      "enquiries",
      "enquiry_items",
      "dealer_applications",
      "contact_messages",
      "audit_logs",
      "business_settings",
      "gallery_images",
    ];

    const existingTablesResult = await client<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `;
    const existingTableNames = new Set(existingTablesResult.map((t) => t.tablename));

    for (const t of requiredTables) {
      if (!existingTableNames.has(t)) {
        throw new Error(`Missing expected table: ${t}`);
      }
    }
    console.log(`[PASS] All ${requiredTables.length} required tables confirmed present.`);

    // 4. Verify or Seed the 8 Authentic Products
    console.log("\n4. Verifying published products...");
    const existingProducts = await db.select().from(schema.products);
    console.log(`Found ${existingProducts.length} products in database.`);

    if (existingProducts.length === 0) {
      console.log("Database has 0 products. Seeding the 8 signature products...");

      const SEED_PRODUCTS = [
        {
          slug: "soil-super",
          name: "Soil Super",
          category: "Soil Health",
          shortDescription: "Organic carbon soil conditioner from the Soil Super Series.",
          imageUrl: "/images/products/soil-super/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 1,
        },
        {
          slug: "soil-super-granules",
          name: "Soil Super Granules",
          category: "Soil Health",
          shortDescription: "Granular format in the Soil Super Series.",
          imageUrl: "/images/products/soil-super-granules/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 2,
        },
        {
          slug: "volvo-super",
          name: "Volvo Super",
          category: "Soil Health",
          shortDescription: "Organic carbon product. Contact us for full details.",
          imageUrl: "/images/products/volvo-super/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 3,
        },
        {
          slug: "martin-gold",
          name: "Martin Gold",
          category: "Crop Nutrition",
          shortDescription: "Contact us for full product details.",
          imageUrl: "/images/products/martin-gold/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 4,
        },
        {
          slug: "robust",
          name: "Robust",
          category: "Crop Nutrition",
          shortDescription: "Contact us for full product details.",
          imageUrl: "/images/products/robust/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 5,
        },
        {
          slug: "recover",
          name: "Recover",
          category: "Crop Protection",
          shortDescription: "Contact us for full product details.",
          imageUrl: "/images/products/recover/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 6,
        },
        {
          slug: "un-zyme",
          name: "UN-Zyme",
          category: "Crop Nutrition",
          shortDescription: "Contact us for full product details.",
          imageUrl: "/images/products/un-zyme/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 7,
        },
        {
          slug: "un-saf",
          name: "UN-Saf",
          category: "Crop Protection",
          shortDescription: "Contact us for full product details.",
          imageUrl: "/images/products/un-saf/primary.webp",
          status: "published" as const,
          isPublic: true,
          sortOrder: 8,
        },
      ];

      for (const p of SEED_PRODUCTS) {
        await db.insert(schema.products).values(p);
        console.log(`[SEED] Created product '${p.name}' (${p.slug})`);
      }
    } else {
      console.log("[PASS] Products already exist. Preserving existing records without overwrite.");
    }

    console.log("\n==================================================");
    console.log("[SUCCESS] Production database migration & verification complete!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n[MIGRATION ERROR]:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

