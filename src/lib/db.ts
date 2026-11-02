import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

/**
 * Standard PostgreSQL Database Connection Pool
 * Configured using postgres.js and Drizzle ORM
 */

const connectionString =
  process.env["DATABASE_URL"] ||
  "postgresql://postgres:postgres@localhost:5432/uncropcare";

// Determine if we are in production
const isProduction = process.env.NODE_ENV === "production";

// Configure postgres.js client
// In development, limit connection pool to prevent exhausting connections during HMR
const client = postgres(connectionString, {
  max: isProduction ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Compatibility with connection poolers (PgBouncer, Neon, Supabase)
  ssl:
    isProduction &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1")
      ? "require"
      : undefined,
});

export const db = drizzle(client, { schema });
export { client };

