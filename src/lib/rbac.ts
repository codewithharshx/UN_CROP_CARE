// UN CROP CARE — Staff Role-Based Access Control (RBAC)
// Strictly defines the 7 staff roles, permissions matrix, and authorization helpers

export const STAFF_ROLES = [
  "super_admin",
  "business_admin",
  "manager",
  "accountant",
  "sales_executive",
  "inventory_manager",
  "billing_staff",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type Permission =
  | "admin:full"           // Full system & staff administration
  | "business:manage"      // Business settings, general oversight
  | "products:read"        // View products catalogue
  | "products:write"       // Create, update, publish, archive products
  | "enquiries:read"       // View customer enquiries
  | "enquiries:write"      // Update status, assign, respond to enquiries
  | "dealers:read"         // View dealer applications
  | "dealers:write"        // Approve, reject, update dealer applications
  | "messages:read"        // View inbound contact messages
  | "messages:write"       // Update contact message status
  | "gallery:write"        // Manage gallery images
  | "finance:read"         // View accounting, invoices, financial records
  | "finance:write"        // Issue invoices, log payments
  | "inventory:read"       // View stock levels, batch numbers
  | "inventory:write"      // Update stock, log receipts
  | "audit:read"           // View audit logs
  | "staff:manage";        // Invite staff, assign roles

/**
 * Explicit Permissions Matrix for UN CROP CARE
 */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  super_admin: [
    "admin:full",
    "business:manage",
    "products:read",
    "products:write",
    "enquiries:read",
    "enquiries:write",
    "dealers:read",
    "dealers:write",
    "messages:read",
    "messages:write",
    "gallery:write",
    "finance:read",
    "finance:write",
    "inventory:read",
    "inventory:write",
    "audit:read",
    "staff:manage",
  ],
  business_admin: [
    "business:manage",
    "products:read",
    "products:write",
    "enquiries:read",
    "enquiries:write",
    "dealers:read",
    "dealers:write",
    "messages:read",
    "messages:write",
    "gallery:write",
    "audit:read",
  ],
  manager: [
    "products:read",
    "enquiries:read",
    "enquiries:write",
    "dealers:read",
    "dealers:write",
    "messages:read",
    "messages:write",
    "gallery:write",
  ],
  accountant: [
    "products:read",
    "enquiries:read",
    "finance:read",
    "finance:write",
  ],
  sales_executive: [
    "products:read",
    "enquiries:read",
    "enquiries:write",
    "dealers:read",
  ],
  inventory_manager: [
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
  ],
  billing_staff: [
    "products:read",
    "finance:read",
    "finance:write",
  ],
};

/**
 * Checks whether any of the user's assigned roles has the specified permission
 */
export function hasPermission(roles: StaffRole[], permission: Permission): boolean {
  return roles.some((role) => {
    const perms = ROLE_PERMISSIONS[role];
    return perms ? perms.includes("admin:full") || perms.includes(permission) : false;
  });
}

/**
 * Checks whether any of the user's assigned roles has at least one of the specified permissions
 */
export function hasAnyPermission(roles: StaffRole[], permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(roles, perm));
}

/**
 * Formats staff role enum into a friendly human-readable label
 */
export function formatRoleLabel(role: StaffRole): string {
  switch (role) {
    case "super_admin":
      return "Super Administrator";
    case "business_admin":
      return "Business Administrator";
    case "manager":
      return "Manager";
    case "accountant":
      return "Accountant";
    case "sales_executive":
      return "Sales Executive";
    case "inventory_manager":
      return "Inventory Manager";
    case "billing_staff":
      return "Billing Staff";
    default:
      return role;
  }
}

