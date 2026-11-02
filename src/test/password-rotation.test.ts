import { describe, it, expect } from "bun:test";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { users, accounts, sessions, userRoles } from "../../drizzle/schema";

describe("Super Admin Password Rotation Test Suite", () => {
  const testEmail = `rotation.test.${Date.now()}@uncropcare.in`;
  const initialPassword = "InitialSecurePassword123!";
  const rotatedPassword = "RotatedSuperSecurePassword456!";

  it("verifies hashPassword and verifyPassword function correctly", async () => {
    const hash = await hashPassword(initialPassword);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(20);

    const match = await verifyPassword({ hash, password: initialPassword });
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword({ hash, password: "WrongPassword123!" });
    expect(wrongMatch).toBe(false);
  });

  it("provisions a test user and verifies password rotation and session invalidation", async () => {
    // 1. Create user via Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: initialPassword,
        name: "Rotation Test Admin",
      },
    });

    expect(signUpResult.user.id).toBeDefined();
    const userId = signUpResult.user.id;

    // 2. Assign super_admin role
    await db.insert(userRoles).values({
      userId,
      role: "super_admin",
    });

    // 3. Verify initial login works
    const login1 = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: initialPassword,
      },
    });
    expect(login1.token).toBeDefined();

    // Verify session exists
    const userSessionsBefore = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));
    expect(userSessionsBefore.length).toBeGreaterThanOrEqual(1);

    // 4. Rotate password using Better Auth hashPassword
    const newHash = await hashPassword(rotatedPassword);
    await db.transaction(async (tx) => {
      await tx
        .update(accounts)
        .set({ password: newHash, updatedAt: new Date() })
        .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")));

      await tx.delete(sessions).where(eq(sessions.userId, userId));
    });

    // 5. Verify all previous sessions are invalidated
    const userSessionsAfter = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));
    expect(userSessionsAfter.length).toBe(0);

    // 6. Old password MUST now be rejected
    await expect(
      auth.api.signInEmail({
        body: {
          email: testEmail,
          password: initialPassword,
        },
      })
    ).rejects.toThrow();

    // 7. New password MUST authenticate successfully
    const login2 = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: rotatedPassword,
      },
    });
    expect(login2.token).toBeDefined();
    expect(login2.user.id).toBe(userId);

    // 8. Role super_admin MUST remain intact
    const [role] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "super_admin")));
    expect(role).toBeDefined();

    // Cleanup
    await db.delete(users).where(eq(users.id, userId));
  });
});

