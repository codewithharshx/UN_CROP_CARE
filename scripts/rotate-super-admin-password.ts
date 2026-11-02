// UN CROP CARE — Secure Super Admin Password Rotation CLI
// Safely rotates the master credentials of an existing super_admin account.
// Features: Masked interactive entry, Better Auth scrypt hashing, atomic database update,
// session revocation, zero plaintext exposure, and automated post-rotation verification.

import { eq, and } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { users, accounts, sessions, userRoles, auditLogs } from "../drizzle/schema";
import { promptPasswordWithConfirmation } from "./lib/prompt-password";

async function rotateSuperAdminPassword() {
  console.log("==================================================");
  console.log("UN CROP CARE: Super Admin Password Rotation CLI");
  console.log("==================================================");

  // 1. Refuse CLI password arguments
  if (process.argv.length > 3) {
    console.error("\n[SECURITY VIOLATION] Providing passwords via command-line arguments is strictly prohibited.");
    console.error("Usage: bun run scripts/rotate-super-admin-password.ts [email]");
    console.error("The new password must be entered interactively through the masked prompt.");
    process.exit(1);
  }

  // 2. Identify target administrator
  const targetEmail = (process.argv[2] || "admin@uncropcare.in").trim().toLowerCase();

  console.log(`\nInspecting target administrator: ${targetEmail}`);

  const [targetUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, targetEmail));

  if (!targetUser) {
    console.error(`\n[ABORT] No user found with email '${targetEmail}'.`);
    console.error("Check the email address and ensure the user exists before running rotation.");
    process.exit(1);
  }

  // Verify super_admin role
  const [adminRole] = await db
    .select({ id: userRoles.id, role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, targetUser.id), eq(userRoles.role, "super_admin")));

  if (!adminRole) {
    console.error(`\n[ABORT] User '${targetEmail}' exists but does NOT possess the 'super_admin' role.`);
    console.error("Password rotation through this CLI is restricted to super administrators.");
    process.exit(1);
  }

  // Verify credential account exists
  const [credentialAccount] = await db
    .select({ id: accounts.id, providerId: accounts.providerId })
    .from(accounts)
    .where(and(eq(accounts.userId, targetUser.id), eq(accounts.providerId, "credential")));

  if (!credentialAccount) {
    console.error(`\n[ABORT] No email/password credential account found for user '${targetEmail}'.`);
    process.exit(1);
  }

  console.log(`  - User ID:      ${targetUser.id}`);
  console.log(`  - Account Name: ${targetUser.name}`);
  console.log(`  - Verified:     super_admin confirmed`);
  console.log("\nPlease enter the new master password.");

  // 3. Masked interactive entry
  let newPassword = "";
  try {
    newPassword = await promptPasswordWithConfirmation(
      "Enter new master password (min 12 chars): ",
      "Confirm new master password: ",
      12
    );
  } catch (err: any) {
    console.error(`\n[ERROR] ${err.message}`);
    process.exit(1);
  }

  console.log("\nHashing password using Better Auth scrypt engine...");

  // 4. Hash password using Better Auth official crypto
  const hashedPassword = await hashPassword(newPassword);

  console.log("Applying atomic database update and revoking active sessions...");

  // 5. Atomic transaction: update password + revoke sessions + audit log
  await db.transaction(async (tx) => {
    // Update credential account password
    await tx
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.userId, targetUser.id), eq(accounts.providerId, "credential")));

    // Revoke all existing sessions for this administrator
    const deletedSessions = await tx
      .delete(sessions)
      .where(eq(sessions.userId, targetUser.id))
      .returning({ id: sessions.id });

    // Record audit trail
    await tx.insert(auditLogs).values({
      userId: targetUser.id,
      action: "SUPER_ADMIN_PASSWORD_ROTATED",
      entity: "accounts",
      entityId: credentialAccount.id,
      details: {
        email: targetUser.email,
        revokedSessionsCount: deletedSessions.length,
        rotatedAt: new Date().toISOString(),
      },
    });

    console.log(`  - Updated credentials in 'accounts' table`);
    console.log(`  - Revoked ${deletedSessions.length} active administrator session(s)`);
    console.log(`  - Logged security event in 'audit_logs' table`);
  });

  console.log("\nVerifying updated credentials with Better Auth sign-in pipeline...");

  // 6. Verification: Authenticate with new password
  try {
    const verifyResult = await auth.api.signInEmail({
      body: {
        email: targetUser.email,
        password: newPassword,
      },
    });

    if (!verifyResult?.user?.id || verifyResult.user.id !== targetUser.id) {
      throw new Error("Authentication failed: Returned user ID did not match target administrator.");
    }

    // Clean up the temporary test session created during verification
    await db.delete(sessions).where(eq(sessions.userId, targetUser.id));

    // Confirm super_admin role remains intact
    const [persistedRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, targetUser.id), eq(userRoles.role, "super_admin")));

    if (!persistedRole) {
      throw new Error("Integrity check failed: super_admin role missing after rotation.");
    }

    console.log("\n==================================================");
    console.log("[SUCCESS] Master password rotated and verified!");
    console.log(`Target:     ${targetUser.name} (${targetUser.email})`);
    console.log(`User ID:    ${targetUser.id}`);
    console.log(`Role:       super_admin (Active)`);
    console.log(`Sessions:   All previous sessions invalidated`);
    console.log("Credentials securely updated. Log in at /auth.");
    console.log("==================================================");
  } catch (err: any) {
    console.error(`\n[FATAL] Post-rotation verification failed: ${err.message}`);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

rotateSuperAdminPassword();

