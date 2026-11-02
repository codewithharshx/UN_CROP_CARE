// UN CROP CARE - Database Connection Verification
// Tests actual application connection via postgres.js and Drizzle ORM
// Masks credentials and verifies: database name, user name, and permissions

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";

async function verify() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[ERROR] DATABASE_URL is not set in environment.");
    process.exit(1);
  }

  // Parse and display connection target with password masked
  try {
    const urlObj = new URL(dbUrl);
    console.log("--------------------------------------------------");
    console.log("UN CROP CARE: Application Connection Verification");
    console.log("--------------------------------------------------");
    console.log(`Target Host:     ${urlObj.hostname}:${urlObj.port || "5432"}`);
    console.log(`Target Database: ${urlObj.pathname.replace(/^\//, "")}`);
    console.log(`Target User:     ${urlObj.username}`);
    console.log(`Credentials:     [REDACTED]`);
    console.log("--------------------------------------------------");
  } catch {
    console.log("Testing connection string (format: masked)...");
  }

  const client = postgres(dbUrl, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
  });

  const db = drizzle(client, { schema });

  try {
    // 1. Verify Basic Connection and Identities
    const [info] = await client`
      SELECT 
        current_database() AS db,
        current_user AS usr,
        version() AS ver,
        (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS is_super
    `;

    console.log(`[PASS] Connected successfully!`);
    console.log(`  - current_database() : ${info.db}`);
    console.log(`  - current_user       : ${info.usr}`);
    console.log(`  - PostgreSQL version : ${info.ver.split(" ")[0]} ${info.ver.split(" ")[1]}`);
    console.log(`  - Is superuser?      : ${info.is_super ? "YES (Warning)" : "NO (Properly restricted)"}`);

    if (info.db !== "uncropcare") {
      throw new Error(`Connected to unexpected database: ${info.db} (Expected: uncropcare)`);
    }
    if (info.usr !== "uncropcare_app") {
      throw new Error(`Connected as unexpected user: ${info.usr} (Expected: uncropcare_app)`);
    }

    // 2. Verify Schema Permissions (Create, Insert, Select, Drop in transaction)
    console.log("\nVerifying application permissions on uncropcare...");
    await client.begin(async (tx) => {
      await tx`CREATE TABLE IF NOT EXISTS __probe_test (id serial primary key, val text);`;
      await tx`INSERT INTO __probe_test (val) VALUES ('probe_ok');`;
      const rows = await tx`SELECT val FROM __probe_test;`;
      if (rows[0]?.val !== "probe_ok") {
        throw new Error("Permission test insert/select failed.");
      }
      await tx`DROP TABLE __probe_test;`;
    });
    console.log(`[PASS] Permission check succeeded: user can CREATE, INSERT, SELECT, and DROP tables.`);

    // 3. Verify Drizzle ORM query builder works
    console.log("\nVerifying Drizzle ORM query execution...");
    const drizzleResult = await db.execute(sql`SELECT 1 + 1 AS sum;`);
    console.log(`[PASS] Drizzle ORM query execution verified (sum = ${drizzleResult[0]?.sum}).`);

    console.log("\n==================================================");
    console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err: any) {
    console.error(`\n[FAIL] Connection or permission test failed: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();

