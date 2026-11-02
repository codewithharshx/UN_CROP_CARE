import { createServerFn } from "@tanstack/react-start";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import * as schema from "../../drizzle/schema";

// ---------------------------------------------------------------------------
// Rate Limiter (In-Memory per process / IP or phone identifier)
// ---------------------------------------------------------------------------
const submissionRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const cleaned = key.replace(/\s+/g, "").toLowerCase();
  const record = submissionRateLimitMap.get(cleaned);

  if (!record || now > record.resetAt) {
    submissionRateLimitMap.set(cleaned, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= limit) {
    throw new Error("Too many submissions. Please wait a minute before trying again.");
  }

  record.count++;
}

// ---------------------------------------------------------------------------
// 1. PUBLIC PRODUCTS DOMAIN LOGIC & SERVER FUNCTIONS
// ---------------------------------------------------------------------------

export async function getPublicProducts() {
  const rows = await db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      category: schema.products.category,
      short_description: schema.products.shortDescription,
      description: schema.products.description,
      pack_sizes: schema.products.packSizes,
      image_url: schema.products.imageUrl,
    })
    .from(schema.products)
    .where(and(eq(schema.products.status, "published"), eq(schema.products.isPublic, true)))
    .orderBy(asc(schema.products.sortOrder));

  return rows;
}

export async function getPublicProductBySlug(slug: string) {
  const rows = await db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      category: schema.products.category,
      short_description: schema.products.shortDescription,
      description: schema.products.description,
      pack_sizes: schema.products.packSizes,
      image_url: schema.products.imageUrl,
    })
    .from(schema.products)
    .where(and(eq(schema.products.slug, slug), eq(schema.products.isPublic, true)))
    .limit(1);

  return rows[0] ?? null;
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  return await getPublicProducts();
});

export const getProduct = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    return await getPublicProductBySlug(data.slug);
  });

// ---------------------------------------------------------------------------
// 2. ENQUIRY SUBMISSION DOMAIN LOGIC & SERVER FUNCTIONS
// ---------------------------------------------------------------------------

const phone = z
  .string()
  .trim()
  .min(10, "Enter a valid mobile number")
  .max(20)
  .regex(/^[+\d\s-]+$/, "Digits only");

const opt = (n: number) => z.string().trim().max(n).optional().or(z.literal(""));

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone,
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  pin_code: opt(10),
  location: opt(150),
  message: opt(1000),
  items: z
    .array(
      z.object({
        slug: z.string().max(120),
        name: z.string().max(120),
        quantity: z.string().max(30),
        pack: z.string().max(60),
      })
    )
    .max(50),
  _hp: z.string().max(100).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export async function createPublicEnquiry(data: EnquiryInput) {
  // Honeypot check: reject spam silently
  if (data._hp && data._hp.trim().length > 0) {
    return { reference: "UNC-HONEYPOT" };
  }

  // Rate limit per phone number
  checkRateLimit(`enquiry-${data.phone}`, 5, 60_000);

  // Database transaction: insert enquiry + individual items
  return await db.transaction(async (tx) => {
    const [insertedEnquiry] = await tx
      .insert(schema.enquiries)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        location: data.location || null,
        pinCode: data.pin_code || null,
        message: data.message || null,
        items: data.items,
        status: "New",
      })
      .returning({
        id: schema.enquiries.id,
        reference: schema.enquiries.reference,
      });

    if (data.items.length > 0) {
      await tx.insert(schema.enquiryItems).values(
        data.items.map((item) => ({
          enquiryId: insertedEnquiry.id,
          productSlug: item.slug,
          productName: item.name,
          quantity: item.quantity,
          packSize: item.pack || null,
        }))
      );
    }

    return { reference: insertedEnquiry.reference };
  });
}

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((d: unknown) => enquirySchema.parse(d))
  .handler(async ({ data }) => {
    return await createPublicEnquiry(data);
  });

// ---------------------------------------------------------------------------
// 3. DEALER APPLICATION SUBMISSION DOMAIN LOGIC & SERVER FUNCTIONS
// ---------------------------------------------------------------------------

export const dealerSchema = z.object({
  applicant_name: z.string().trim().min(2, "Enter your name").max(100),
  business_name: z.string().trim().min(2, "Enter business name").max(150),
  mobile: phone,
  whatsapp: opt(20),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter city").max(80),
  state: z.string().trim().min(2, "Enter state").max(80),
  pin_code: opt(10),
  business_type: opt(80),
  current_dealership: opt(300),
  experience_years: opt(20),
  message: opt(1000),
  _hp: z.string().max(100).optional(),
});

export type DealerInput = z.infer<typeof dealerSchema>;

export async function createDealerApplication(data: DealerInput) {
  // Honeypot check
  if (data._hp && data._hp.trim().length > 0) {
    return { ok: true };
  }

  // Rate limit
  checkRateLimit(`dealer-${data.mobile}`, 5, 60_000);

  await db.insert(schema.dealerApplications).values({
    applicantName: data.applicant_name,
    businessName: data.business_name,
    mobile: data.mobile,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    city: data.city,
    state: data.state,
    pinCode: data.pin_code || null,
    businessType: data.business_type || null,
    currentDealership: data.current_dealership || null,
    experienceYears: data.experience_years || null,
    message: data.message || null,
    status: "New",
  });

  return { ok: true };
}

export const submitDealer = createServerFn({ method: "POST" })
  .validator((d: unknown) => dealerSchema.parse(d))
  .handler(async ({ data }) => {
    return await createDealerApplication(data);
  });

// ---------------------------------------------------------------------------
// 4. CONTACT MESSAGE SUBMISSION DOMAIN LOGIC & SERVER FUNCTIONS
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone,
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  subject: opt(150),
  message: z.string().trim().min(5, "Write a message").max(1000),
  _hp: z.string().max(100).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function createContactMessage(data: ContactInput) {
  // Honeypot check
  if (data._hp && data._hp.trim().length > 0) {
    return { ok: true };
  }

  // Rate limit
  checkRateLimit(`contact-${data.phone}`, 5, 60_000);

  await db.insert(schema.contactMessages).values({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    subject: data.subject || null,
    message: data.message,
    status: "New",
  });

  return { ok: true };
}

export const submitContact = createServerFn({ method: "POST" })
  .validator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    return await createContactMessage(data);
  });
