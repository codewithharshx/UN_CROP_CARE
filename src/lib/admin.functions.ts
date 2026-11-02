import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import * as schema from "../../drizzle/schema";
import { StaffRole, Permission, hasPermission } from "./rbac";
import { getStorageAdapter } from "./storage/adapter";

/**
 * Internal helper to authenticate staff caller and ensure required permission
 */
export async function requireStaffWithPermission(headers: Headers | undefined, requiredPermission: Permission) {
  if (!headers) {
    throw new Error("Unauthorized: Missing request headers");
  }

  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  const rolesResult = await db
    .select({ role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, session.user.id));

  const roles = rolesResult.map((r) => r.role as StaffRole);
  if (roles.length === 0) {
    throw new Error("Forbidden: User does not have staff permissions");
  }

  if (!hasPermission(roles, requiredPermission)) {
    throw new Error(`Forbidden: Missing required permission '${requiredPermission}'`);
  }

  return { session, user: session.user, roles };
}

// ---------------------------------------------------------------------------
// 1. ENQUIRIES ADMIN
// ---------------------------------------------------------------------------

export async function fetchAdminEnquiries(headers?: Headers) {
  await requireStaffWithPermission(headers, "enquiries:read");

  return await db
    .select({
      id: schema.enquiries.id,
      reference: schema.enquiries.reference,
      name: schema.enquiries.name,
      phone: schema.enquiries.phone,
      email: schema.enquiries.email,
      location: schema.enquiries.location,
      pin_code: schema.enquiries.pinCode,
      message: schema.enquiries.message,
      items: schema.enquiries.items,
      status: schema.enquiries.status,
      created_at: schema.enquiries.createdAt,
      updated_at: schema.enquiries.updatedAt,
    })
    .from(schema.enquiries)
    .orderBy(desc(schema.enquiries.createdAt));
}

export const getAdminEnquiriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  return await fetchAdminEnquiries(req?.headers);
});

const updateEnquiryStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "New",
    "Contacted",
    "Quotation Sent",
    "Negotiation",
    "Approved",
    "Converted to Order",
    "Rejected",
    "Closed",
  ]),
});

export async function changeEnquiryStatus(
  id: string,
  status: z.infer<typeof updateEnquiryStatusSchema>["status"],
  headers?: Headers
) {
  const { user } = await requireStaffWithPermission(headers, "enquiries:write");

  await db.transaction(async (tx) => {
    await tx
      .update(schema.enquiries)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.enquiries.id, id));

    await tx.insert(schema.auditLogs).values({
      userId: user.id,
      action: "STATUS_UPDATE",
      entity: "enquiries",
      entityId: id,
      details: { newStatus: status },
    });
  });

  return { ok: true };
}

export const updateEnquiryStatusFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => updateEnquiryStatusSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    return await changeEnquiryStatus(data.id, data.status, req?.headers);
  });

// ---------------------------------------------------------------------------
// 2. DEALER APPLICATIONS ADMIN
// ---------------------------------------------------------------------------

export async function fetchAdminDealers(headers?: Headers) {
  await requireStaffWithPermission(headers, "dealers:read");

  return await db
    .select({
      id: schema.dealerApplications.id,
      applicant_name: schema.dealerApplications.applicantName,
      business_name: schema.dealerApplications.businessName,
      mobile: schema.dealerApplications.mobile,
      whatsapp: schema.dealerApplications.whatsapp,
      email: schema.dealerApplications.email,
      city: schema.dealerApplications.city,
      state: schema.dealerApplications.state,
      pin_code: schema.dealerApplications.pinCode,
      business_type: schema.dealerApplications.businessType,
      current_dealership: schema.dealerApplications.currentDealership,
      experience_years: schema.dealerApplications.experienceYears,
      message: schema.dealerApplications.message,
      status: schema.dealerApplications.status,
      created_at: schema.dealerApplications.createdAt,
      updated_at: schema.dealerApplications.updatedAt,
    })
    .from(schema.dealerApplications)
    .orderBy(desc(schema.dealerApplications.createdAt));
}

export const getAdminDealersFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  return await fetchAdminDealers(req?.headers);
});

// ---------------------------------------------------------------------------
// 3. CONTACT MESSAGES ADMIN
// ---------------------------------------------------------------------------

export async function fetchAdminContactMessages(headers?: Headers) {
  await requireStaffWithPermission(headers, "messages:read");

  return await db
    .select({
      id: schema.contactMessages.id,
      name: schema.contactMessages.name,
      phone: schema.contactMessages.phone,
      email: schema.contactMessages.email,
      subject: schema.contactMessages.subject,
      message: schema.contactMessages.message,
      status: schema.contactMessages.status,
      created_at: schema.contactMessages.createdAt,
      updated_at: schema.contactMessages.updatedAt,
    })
    .from(schema.contactMessages)
    .orderBy(desc(schema.contactMessages.createdAt));
}

export const getAdminContactMessagesFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  return await fetchAdminContactMessages(req?.headers);
});

// ---------------------------------------------------------------------------
// 4. PRODUCTS ADMIN
// ---------------------------------------------------------------------------

export async function fetchAdminProducts(headers?: Headers) {
  await requireStaffWithPermission(headers, "products:read");

  return await db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      category: schema.products.category,
      short_description: schema.products.shortDescription,
      description: schema.products.description,
      pack_sizes: schema.products.packSizes,
      image_url: schema.products.imageUrl,
      status: schema.products.status,
      is_public: schema.products.isPublic,
      sort_order: schema.products.sortOrder,
      created_at: schema.products.createdAt,
      updated_at: schema.products.updatedAt,
    })
    .from(schema.products)
    .orderBy(asc(schema.products.sortOrder));
}

export const getAdminProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  return await fetchAdminProducts(req?.headers);
});

const updateProductSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().max(80).optional(),
    short_description: z.string().max(500).optional().nullable(),
    description: z.string().optional().nullable(),
    pack_sizes: z.string().max(255).optional().nullable(),
    image_url: z.string().optional().nullable(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_public: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  }),
});

export async function updateProductDetails(
  id: string,
  patch: z.infer<typeof updateProductSchema>["patch"],
  headers?: Headers
) {
  const { user } = await requireStaffWithPermission(headers, "products:write");

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (patch.name !== undefined) updateValues.name = patch.name;
  if (patch.category !== undefined) updateValues.category = patch.category;
  if (patch.short_description !== undefined) updateValues.shortDescription = patch.short_description;
  if (patch.description !== undefined) updateValues.description = patch.description;
  if (patch.pack_sizes !== undefined) updateValues.packSizes = patch.pack_sizes;
  if (patch.image_url !== undefined) updateValues.imageUrl = patch.image_url;
  if (patch.status !== undefined) updateValues.status = patch.status;
  if (patch.is_public !== undefined) updateValues.isPublic = patch.is_public;
  if (patch.sort_order !== undefined) updateValues.sortOrder = patch.sort_order;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.products)
      .set(updateValues)
      .where(eq(schema.products.id, id));

    await tx.insert(schema.auditLogs).values({
      userId: user.id,
      action: "PRODUCT_UPDATE",
      entity: "products",
      entityId: id,
      details: patch,
    });
  });

  return { ok: true };
}

export const updateAdminProductFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => updateProductSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    return await updateProductDetails(data.id, data.patch, req?.headers);
  });

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  sort_order: z.number().int().default(0),
});

export async function createProductRecord(
  data: z.infer<typeof createProductSchema>,
  headers?: Headers
) {
  const { user } = await requireStaffWithPermission(headers, "products:write");

  const [newProduct] = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.products)
      .values({
        name: data.name,
        slug: data.slug,
        sortOrder: data.sort_order,
        status: "draft",
        isPublic: false,
      })
      .returning({
        id: schema.products.id,
        slug: schema.products.slug,
      });

    await tx.insert(schema.auditLogs).values({
      userId: user.id,
      action: "PRODUCT_CREATE",
      entity: "products",
      entityId: inserted.id,
      details: { name: data.name, slug: data.slug },
    });

    return [inserted];
  });

  return { ok: true, product: newProduct };
}

export const createAdminProductFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => createProductSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    return await createProductRecord(data, req?.headers);
  });

// ---------------------------------------------------------------------------
// 5. ASSET & IMAGE MANAGEMENT (Upload, Gallery, Product Image replacement)
// ---------------------------------------------------------------------------

const uploadAssetSchema = z.object({
  fileBase64: z.string().min(1),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
  ]),
  originalName: z.string().optional(),
});

export async function handleAssetUpload(
  data: z.infer<typeof uploadAssetSchema>,
  headers?: Headers
) {
  const { user } = await requireStaffWithPermission(headers, "products:write");

  const buffer = Buffer.from(data.fileBase64, "base64");
  const adapter = getStorageAdapter();
  const result = await adapter.save({
    buffer,
    mimeType: data.mimeType,
    originalName: data.originalName,
  });

  await db.insert(schema.auditLogs).values({
    userId: user.id,
    action: "ASSET_UPLOADED",
    entity: "uploads",
    entityId: result.filename,
    details: {
      url: result.url,
      size: result.size,
      mimeType: result.mimeType,
    },
  });

  return result;
}

export const uploadAssetFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => uploadAssetSchema.parse(d))
  .handler(async ({ data }) => {
    const req = getRequest();
    return await handleAssetUpload(data, req?.headers);
  });

export async function fetchAdminGallery(headers?: Headers) {
  await requireStaffWithPermission(headers, "gallery:write");

  return await db
    .select()
    .from(schema.galleryImages)
    .orderBy(asc(schema.galleryImages.sortOrder));
}

export const getAdminGalleryFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  return await fetchAdminGallery(req?.headers);
});
