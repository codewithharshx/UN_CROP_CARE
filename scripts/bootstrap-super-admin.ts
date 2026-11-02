// UN CROP CARE — One-Time Super Admin Bootstrap CLI (Secure Version)
// Provisions the initial super_admin account with masked password input.
// Command-line password arguments are strictly forbidden and rejected.

import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { userRoles, auditLogs, users } from "../drizzle/schema";
import { promptPasswordWithConfirmation } from "./lib/prompt-password";

async function bootstrap() {
  console.log("==================================================");
  console.log("UN CROP CARE: Super Administrator Bootstrap CLI");
  console.log("==================================================");

  // 1. Refuse command-line password arguments
  if (process.argv.length > 3) {
    console.error("\n[SECURITY VIOLATION] Providing passwords via command-line arguments is strictly prohibited.");
    console.error("Usage: bun run scripts/bootstrap-super-admin.ts [email] [name]");
    console.error("Password must be entered securely through the interactive masked prompt.");
    process.exit(1);
  }

  // 2. Strict Check: Refuse duplicate super_admin provisioning
  const existingSuperAdmins = await db
    .select({
      id: userRoles.id,
      userId: userRoles.userId,
      email: users.email,
      name: users.name,
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(userRoles.role, "super_admin"));

  if (existingSuperAdmins.length > 0) {
    console.log("\n[ABORT] A super_admin account is already provisioned in this system:");
    for (const sa of existingSuperAdmins) {
      console.log(`  - ${sa.name} (${sa.email})`);
    }
    console.log("\nFor production security, bootstrap can only be executed once.");
    console.log("To rotate credentials, use: bun run scripts/rotate-super-admin-password.ts");
    console.log("To add additional staff, log in to the admin dashboard with your super_admin account.");
    process.exit(1);
  }

  // 3. Read email and name (non-sensitive)
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || "admin@uncropcare.in").trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || "System Administrator").trim();

  // Verify email does not already exist
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    console.error(`\n[ABORT] User '${email}' already exists in the database.`);
    console.error("Cannot bootstrap an existing user. Use the password rotation script instead.");
    process.exit(1);
  }

  console.log(`\nTarget Administrator Account:`);
  console.log(`  - Name:  ${name}`);
  console.log(`  - Email: ${email}`);
  console.log(`  - Role:  super_admin`);
  console.log("\nPlease enter the master password for this account.");

  let password = "";
  try {
    password = await promptPasswordWithConfirmation(
      "Enter new master password (min 12 chars): ",
      "Confirm master password: ",
      12
    );
  } catch (err: any) {
    console.error(`\n[ERROR] ${err.message}`);
    process.exit(1);
  }

  console.log("\nProvisioning super_admin account through Better Auth...");

  try {
    // 4. Create user account via Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!signUpResult?.user?.id) {
      throw new Error("Failed to create user account through Better Auth");
    }

    const userId = signUpResult.user.id;

    // 5. Assign super_admin role and log audit trail
    await db.transaction(async (tx) => {
      await tx.insert(userRoles).values({
        userId,
        role: "super_admin",
      });

      await tx.insert(auditLogs).values({
        userId,
        action: "BOOTSTRAP_SUPER_ADMIN",
        entity: "user_roles",
        entityId: userId,
        details: {
          email,
          name,
          role: "super_admin",
        },
      });
    });

    console.log("\n==================================================");
    console.log("[SUCCESS] Super Administrator provisioned successfully!");
    console.log(`User ID: ${userId}`);
    console.log(`Email:   ${email}`);
    console.log("Credentials securely stored. Log in at /auth.");
    console.log("==================================================");
  } catch (err: any) {
    console.error(`\n[FAIL] Bootstrap failed: ${err.message}`);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

bootstrap();
