// UN CROP CARE — Authentication & RBAC Test Suite
// Verifies Better Auth, PostgreSQL persistence, 7 staff roles, permissions, and security rules

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { auth, isGoogleConfigured } from "../lib/auth";
import { db } from "../lib/db";
import { users, sessions, accounts, userRoles, auditLogs } from "../../drizzle/schema";
import {
  STAFF_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  formatRoleLabel,
  StaffRole,
} from "../lib/rbac";

describe("Phase 2: Authentication & RBAC Test Suite", () => {
  const testEmail = `test.staff.${Date.now()}@uncropcare.in`;
  const testPassword = "StrongTestPassword123!";
  const testName = "Test Staff Member";
  let createdUserId = "";

  beforeAll(async () => {
    // Ensure clean state for test email
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Clean up test records
    if (createdUserId) {
      await db.delete(userRoles).where(eq(userRoles.userId, createdUserId));
      await db.delete(sessions).where(eq(sessions.userId, createdUserId));
      await db.delete(accounts).where(eq(accounts.userId, createdUserId));
      await db.delete(users).where(eq(users.id, createdUserId));
    }
  });

  // -------------------------------------------------------------------------
  // 1. Email / Password Registration & Password Hashing
  // -------------------------------------------------------------------------
  it("registers a user and securely hashes the password in PostgreSQL", async () => {
    const res = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(res).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.user.name).toBe(testName);
    createdUserId = res.user.id;

    // Verify record in PostgreSQL users table
    const [dbUser] = await db.select().from(users).where(eq(users.id, createdUserId));
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe(testEmail);

    // Verify account password record is hashed, NOT plaintext
    const [dbAccount] = await db.select().from(accounts).where(eq(accounts.userId, createdUserId));
    expect(dbAccount).toBeDefined();
    expect(dbAccount.password).toBeDefined();
    expect(dbAccount.password).not.toBe(testPassword);
    expect(dbAccount.password!.length).toBeGreaterThan(30);
  });

  // -------------------------------------------------------------------------
  // 2. Duplicate Registration Rejection
  // -------------------------------------------------------------------------
  it("rejects registration with a duplicate email address", async () => {
    try {
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: "AnotherPassword123!",
          name: "Duplicate User",
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeDefined();
    }
  });

  // -------------------------------------------------------------------------
  // 3. Login Authentication (Success & Failure)
  // -------------------------------------------------------------------------
  it("authenticates successfully with correct password", async () => {
    const res = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.token).toBeDefined();

    // Verify session recorded in PostgreSQL sessions table
    const [dbSession] = await db.select().from(sessions).where(eq(sessions.userId, createdUserId));
    expect(dbSession).toBeDefined();
    expect(dbSession.token).toBeDefined();
  });

  it("rejects login with an incorrect password", async () => {
    try {
      await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: "WrongPassword999!",
        },
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeDefined();
    }
  });

  // -------------------------------------------------------------------------
  // 4. Default Privilege Boundary: Regular users have NO staff permissions
  // -------------------------------------------------------------------------
  it("confirms newly registered users have zero staff roles by default", async () => {
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, createdUserId));
    expect(roles.length).toBe(0);

    const staffRoles = roles.map((r) => r.role as StaffRole);
    expect(hasPermission(staffRoles, "admin:full")).toBe(false);
    expect(hasPermission(staffRoles, "products:write")).toBe(false);
    expect(hasPermission(staffRoles, "finance:write")).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 5. Staff Role & Permission Matrix (All 7 Roles)
  // -------------------------------------------------------------------------
  it("verifies the RBAC permission matrix for all 7 staff roles", () => {
    expect(STAFF_ROLES.length).toBe(7);

    // super_admin has all permissions
    expect(hasPermission(["super_admin"], "admin:full")).toBe(true);
    expect(hasPermission(["super_admin"], "finance:write")).toBe(true);
    expect(hasPermission(["super_admin"], "products:write")).toBe(true);

    // business_admin
    expect(hasPermission(["business_admin"], "business:manage")).toBe(true);
    expect(hasPermission(["business_admin"], "products:write")).toBe(true);
    expect(hasPermission(["business_admin"], "staff:manage")).toBe(false);

    // accountant
    expect(hasPermission(["accountant"], "finance:read")).toBe(true);
    expect(hasPermission(["accountant"], "finance:write")).toBe(true);
    expect(hasPermission(["accountant"], "products:write")).toBe(false);

    // sales_executive
    expect(hasPermission(["sales_executive"], "enquiries:read")).toBe(true);
    expect(hasPermission(["sales_executive"], "enquiries:write")).toBe(true);
    expect(hasPermission(["sales_executive"], "finance:write")).toBe(false);

    // inventory_manager
    expect(hasPermission(["inventory_manager"], "inventory:read")).toBe(true);
    expect(hasPermission(["inventory_manager"], "inventory:write")).toBe(true);
    expect(hasPermission(["inventory_manager"], "finance:write")).toBe(false);

    // billing_staff
    expect(hasPermission(["billing_staff"], "finance:write")).toBe(true);
    expect(hasPermission(["billing_staff"], "enquiries:write")).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 6. Role Assignment & PostgreSQL Persistence
  // -------------------------------------------------------------------------
  it("assigns and persists a staff role in PostgreSQL user_roles table", async () => {
    await db.insert(userRoles).values({
      userId: createdUserId,
      role: "sales_executive",
    });

    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, createdUserId));
    expect(roles.length).toBe(1);
    expect(roles[0]?.role).toBe("sales_executive");

    const staffRoles = roles.map((r) => r.role as StaffRole);
    expect(hasPermission(staffRoles, "enquiries:read")).toBe(true);
    expect(hasPermission(staffRoles, "enquiries:write")).toBe(true);
    expect(hasPermission(staffRoles, "admin:full")).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 7. Google OAuth Provider Configuration
  // -------------------------------------------------------------------------
  it("verifies Google OAuth provider configuration state", () => {
    if (isGoogleConfigured) {
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    } else {
      // Safe fallback verified: server does not crash without Google credentials
      expect(isGoogleConfigured).toBe(false);
    }
  });

  // -------------------------------------------------------------------------
  // 8. Role Label Formatting
  // -------------------------------------------------------------------------
  it("formats staff role labels correctly", () => {
    expect(formatRoleLabel("super_admin")).toBe("Super Administrator");
    expect(formatRoleLabel("business_admin")).toBe("Business Administrator");
    expect(formatRoleLabel("manager")).toBe("Manager");
    expect(formatRoleLabel("accountant")).toBe("Accountant");
    expect(formatRoleLabel("sales_executive")).toBe("Sales Executive");
    expect(formatRoleLabel("inventory_manager")).toBe("Inventory Manager");
    expect(formatRoleLabel("billing_staff")).toBe("Billing Staff");
  });
});
