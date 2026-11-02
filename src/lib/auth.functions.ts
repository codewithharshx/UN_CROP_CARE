import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { userRoles, auditLogs, users } from "../../drizzle/schema";
import { StaffRole, STAFF_ROLES, hasPermission, Permission } from "./rbac";

/**
 * Server function to get the current authenticated session
 */
export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  if (!req?.headers) return null;

  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    return session;
  } catch (err) {
    console.error("Error retrieving session:", err);
    return null;
  }
});

/**
 * Server function to get current user and their staff roles
 */
export const getCurrentStaffUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  if (!req?.headers) return null;

  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) return null;

    const rolesResult = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));

    const roles = rolesResult.map((r) => r.role as StaffRole);
    const isStaff = roles.length > 0;
    const isSuperAdmin = roles.includes("super_admin");
    const isBusinessAdmin = roles.includes("business_admin") || isSuperAdmin;

    return {
      user: session.user,
      session: session.session,
      roles,
      isStaff,
      isAdmin: isSuperAdmin || isBusinessAdmin,
      isSuperAdmin,
    };
  } catch (err) {
    console.error("Error retrieving staff user:", err);
    return null;
  }
});

/**
 * Server function to assign a staff role (restricted to super_admin)
 */
export const assignStaffRoleSchema = z.object({
  targetEmail: z.string().trim().email("Invalid email address"),
  role: z.enum(STAFF_ROLES),
});

export const assignStaffRoleFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => assignStaffRoleSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    if (!req?.headers) throw new Error("Unauthorized: Missing request headers");

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) throw new Error("Unauthorized: Must be logged in");

    // Verify caller is super_admin
    const callerRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));

    const isSuperAdmin = callerRoles.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      throw new Error("Forbidden: Only super_admin can assign staff roles");
    }

    // Find target user
    const [targetUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, data.targetEmail.toLowerCase()));

    if (!targetUser) {
      throw new Error(`User with email '${data.targetEmail}' has not registered yet. Ask them to sign up first.`);
    }

    // Assign role in transaction
    await db.transaction(async (tx) => {
      await tx
        .insert(userRoles)
        .values({
          userId: targetUser.id,
          role: data.role,
          assignedBy: session.user.id,
        })
        .onConflictDoNothing();

      // Log in audit logs
      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: "ROLE_ASSIGNED",
        entity: "user_roles",
        entityId: targetUser.id,
        details: {
          targetEmail: targetUser.email,
          role: data.role,
        },
      });
    });

    return {
      success: true,
      message: `Role '${data.role}' successfully granted to ${targetUser.email}`,
    };
  });

