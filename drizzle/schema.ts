import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// 1. ENUMS
// ---------------------------------------------------------------------------

export const staffRoleEnum = pgEnum("staff_role", [
  "super_admin",
  "business_admin",
  "manager",
  "accountant",
  "sales_executive",
  "inventory_manager",
  "billing_staff",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "published",
  "archived",
]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "New",
  "Contacted",
  "Quotation Sent",
  "Negotiation",
  "Approved",
  "Converted to Order",
  "Rejected",
  "Closed",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "New",
  "Reviewed",
  "In Progress",
  "Archived",
]);

// ---------------------------------------------------------------------------
// 2. BETTER AUTH CORE TABLES (Standard Drizzle PostgreSQL schema for Better Auth)
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)]
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("accounts_user_idx").on(table.userId)]
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 3. STAFF ROLES & PERMISSIONS
// ---------------------------------------------------------------------------

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: staffRoleEnum("role").notNull(),
    assignedBy: text("assigned_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_role_unique_idx").on(table.userId, table.role),
    index("user_roles_user_idx").on(table.userId),
  ]
);

// ---------------------------------------------------------------------------
// 4. BUSINESS SETTINGS
// ---------------------------------------------------------------------------

export const businessSettings = pgTable("business_settings", {
  id: text("id").primaryKey().default("default"),
  companyName: text("company_name").notNull().default("UN CROP CARE"),
  tagline: text("tagline").default("Working Together, Prosper Together."),
  taglineMarathi: text("tagline_marathi").default("एकत्र काम करूया, एकत्र प्रगती करूया."),
  promiseMarathi: text("promise_marathi").default("शेतकऱ्यांच्या सेवेसाठी सदैव तत्पर"),
  mission: text("mission").default("Working to help more farmers move towards organic farming."),
  phone: text("phone").default("0788 732 7272"),
  phoneHref: text("phone_href").default("tel:+917887327272"),
  whatsapp: text("whatsapp").default("+91 788 732 7272"),
  whatsappHref: text("whatsapp_href").default("https://wa.me/917887327272"),
  email: text("email").default("info@uncropcare.in"),
  facebook: text("facebook").default("https://www.facebook.com/uncropcare/"),
  address: text("address"),
  gstin: text("gstin"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 5. PRODUCT CATEGORIES & PRODUCTS
// ---------------------------------------------------------------------------

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("categories_sort_idx").on(table.sortOrder)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Crop Care"),
    categoryId: uuid("category_id").references(() => productCategories.id),
    shortDescription: text("short_description"),
    description: text("description"),
    packSizes: text("pack_sizes"),
    imageUrl: text("image_url"),
    status: productStatusEnum("status").default("draft").notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_sort_idx").on(table.sortOrder),
    index("products_category_idx").on(table.category),
    index("products_visibility_idx").on(table.isPublic, table.status),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("product_images_product_idx").on(table.productId)]
);

// ---------------------------------------------------------------------------
// 6. ENQUIRIES & ENQUIRY ITEMS
// ---------------------------------------------------------------------------

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    location: text("location"),
    pinCode: text("pin_code"),
    message: text("message"),
    // Keep JSONB items array for compatibility with existing UI
    items: jsonb("items").default([]).notNull(),
    status: enquiryStatusEnum("status").default("New").notNull(),
    assignedTo: text("assigned_to").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("enquiries_ref_idx").on(table.reference),
    index("enquiries_status_idx").on(table.status),
    index("enquiries_created_idx").on(table.createdAt),
  ]
);

export const enquiryItems = pgTable(
  "enquiry_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enquiryId: uuid("enquiry_id")
      .references(() => enquiries.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    quantity: text("quantity").notNull(),
    packSize: text("pack_size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("enquiry_items_enquiry_idx").on(table.enquiryId)]
);

// ---------------------------------------------------------------------------
// 7. DEALER APPLICATIONS & CONTACT MESSAGES
// ---------------------------------------------------------------------------

export const dealerApplications = pgTable(
  "dealer_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicantName: text("applicant_name").notNull(),
    businessName: text("business_name").notNull(),
    mobile: text("mobile").notNull(),
    whatsapp: text("whatsapp"),
    email: text("email"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pinCode: text("pin_code"),
    businessType: text("business_type"),
    currentDealership: text("current_dealership"),
    experienceYears: text("experience_years"),
    message: text("message"),
    status: submissionStatusEnum("status").default("New").notNull(),
    reviewedBy: text("reviewed_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("dealer_apps_created_idx").on(table.createdAt),
    index("dealer_apps_status_idx").on(table.status),
  ]
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    subject: text("subject"),
    message: text("message").notNull(),
    status: submissionStatusEnum("status").default("New").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("contact_msgs_created_idx").on(table.createdAt),
    index("contact_msgs_status_idx").on(table.status),
  ]
);

// ---------------------------------------------------------------------------
// 8. GALLERY IMAGES & AUDIT LOGS
// ---------------------------------------------------------------------------

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title"),
    altText: text("alt_text").notNull(),
    imageUrl: text("image_url").notNull(),
    category: text("category").default("Farm"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("gallery_sort_idx").on(table.sortOrder)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// 9. RELATIONS
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  roles: many(userRoles),
  assignedEnquiries: many(enquiries),
  auditLogs: many(auditLogs),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  categoryRef: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  images: many(productImages),
}));

export const enquiriesRelations = relations(enquiries, ({ one, many }) => ({
  itemsRel: many(enquiryItems),
  assignedUser: one(users, {
    fields: [enquiries.assignedTo],
    references: [users.id],
  }),
}));

export const enquiryItemsRelations = relations(enquiryItems, ({ one }) => ({
  enquiry: one(enquiries, {
    fields: [enquiryItems.enquiryId],
    references: [enquiries.id],
  }),
  product: one(products, {
    fields: [enquiryItems.productId],
    references: [products.id],
  }),
}));
