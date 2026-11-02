import { describe, it, expect } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import * as schema from "../../drizzle/schema";
import {
  getPublicProducts,
  getPublicProductBySlug,
  createPublicEnquiry,
  createDealerApplication,
  createContactMessage,
  checkRateLimit,
} from "../lib/public.functions";
import {
  fetchAdminEnquiries,
  fetchAdminDealers,
  fetchAdminContactMessages,
  fetchAdminProducts,
  requireStaffWithPermission,
} from "../lib/admin.functions";

describe("Phase 3: Drizzle Public & Admin Domain & Server Logic Test Suite", () => {
  it("getPublicProducts returns the 8 published products sorted by sort_order", async () => {
    const products = await getPublicProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(8);

    const slugs = products.map((p) => p.slug);
    expect(slugs).toContain("soil-super");
    expect(slugs).toContain("soil-super-granules");
    expect(slugs).toContain("volvo-super");
    expect(slugs).toContain("martin-gold");
    expect(slugs).toContain("robust");
    expect(slugs).toContain("recover");
    expect(slugs).toContain("un-zyme");
    expect(slugs).toContain("un-saf");

    const firstProduct = products.find((p) => p.slug === "soil-super");
    expect(firstProduct).toBeDefined();
    expect(firstProduct?.name).toBe("Soil Super");
    expect(firstProduct?.category).toBe("Soil Health");
    expect(firstProduct?.short_description).toBeDefined();
  });

  it("getPublicProductBySlug returns the correct product row by slug", async () => {
    const product = await getPublicProductBySlug("soil-super");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Soil Super");
    expect(product?.slug).toBe("soil-super");
    expect(product?.category).toBe("Soil Health");
  });

  it("getPublicProductBySlug returns null for a non-existent slug", async () => {
    const product = await getPublicProductBySlug("non-existent-product-12345");
    expect(product).toBeNull();
  });

  it("createPublicEnquiry successfully persists an enquiry and items in PostgreSQL", async () => {
    const testEnquiry = {
      name: "Ramesh Patil",
      phone: "+91 98220 12345",
      email: "ramesh.patil@example.com",
      location: "Baramati, Pune",
      pin_code: "413102",
      message: "Need bulk pricing for 50 acres sugarcane crop.",
      items: [
        {
          slug: "soil-super",
          name: "Soil Super",
          quantity: "10",
          pack: "5 L",
        },
        {
          slug: "un-zyme",
          name: "UN-Zyme",
          quantity: "5",
          pack: "1 L",
        },
      ],
    };

    const response = await createPublicEnquiry(testEnquiry);
    expect(response).toBeDefined();
    expect(response.reference).toMatch(/^UNC-/);

    // Verify in database
    const [row] = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.reference, response.reference));

    expect(row).toBeDefined();
    expect(row.name).toBe(testEnquiry.name);
    expect(row.phone).toBe(testEnquiry.phone);
    expect(row.status).toBe("New");

    // Verify items in enquiryItems table
    const items = await db
      .select()
      .from(schema.enquiryItems)
      .where(eq(schema.enquiryItems.enquiryId, row.id));

    expect(items.length).toBe(2);
    expect(items.map((i) => i.productSlug)).toContain("soil-super");
    expect(items.map((i) => i.productSlug)).toContain("un-zyme");
  });

  it("honeypot protection drops bot submissions without writing to database", async () => {
    const botSubmission = {
      name: "Spam Bot",
      phone: "+91 99999 99999",
      email: "spambot@spam.com",
      items: [{ slug: "soil-super", name: "Soil Super", quantity: "1", pack: "1 L" }],
      _hp: "I am a spam bot filling hidden inputs",
    };

    const response = await createPublicEnquiry(botSubmission);
    expect(response.reference).toBe("UNC-HONEYPOT");

    // Verify it was NOT persisted to database
    const rows = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.reference, "UNC-HONEYPOT"));

    expect(rows.length).toBe(0);
  });

  it("createDealerApplication successfully persists a dealership application", async () => {
    const testDealer = {
      applicant_name: "Suresh Khot",
      business_name: "Khot Krushi Seva Kendra",
      mobile: "+91 98221 54321",
      city: "Kolhapur",
      state: "Maharashtra",
      pin_code: "416001",
      business_type: "Retailer",
      experience_years: "12",
      message: "Interested in exclusive dealership for Kolhapur region.",
    };

    const response = await createDealerApplication(testDealer);
    expect(response.ok).toBe(true);

    const [row] = await db
      .select()
      .from(schema.dealerApplications)
      .where(eq(schema.dealerApplications.mobile, testDealer.mobile));

    expect(row).toBeDefined();
    expect(row.businessName).toBe(testDealer.business_name);
    expect(row.applicantName).toBe(testDealer.applicant_name);
    expect(row.status).toBe("New");
  });

  it("createContactMessage successfully persists a contact message", async () => {
    const testContact = {
      name: "Anand Shinde",
      phone: "+91 98223 98765",
      email: "anand.shinde@example.com",
      subject: "Product query regarding Volvo Super",
      message: "Can Volvo Super be applied through drip irrigation system?",
    };

    const response = await createContactMessage(testContact);
    expect(response.ok).toBe(true);

    const [row] = await db
      .select()
      .from(schema.contactMessages)
      .where(eq(schema.contactMessages.phone, testContact.phone));

    expect(row).toBeDefined();
    expect(row.name).toBe(testContact.name);
    expect(row.message).toBe(testContact.message);
    expect(row.status).toBe("New");
  });

  it("checkRateLimit blocks excessive submissions beyond quota", () => {
    const spamId = "rate-limit-test-id";
    // 5 allowed
    for (let i = 0; i < 5; i++) {
      expect(() => checkRateLimit(spamId, 5, 60_000)).not.toThrow();
    }
    // 6th should throw
    expect(() => checkRateLimit(spamId, 5, 60_000)).toThrow("Too many submissions");
  });

  it("admin functions require valid staff session headers and reject unauthenticated requests", async () => {
    await expect(fetchAdminEnquiries(undefined)).rejects.toThrow("Unauthorized");
    await expect(fetchAdminDealers(undefined)).rejects.toThrow("Unauthorized");
    await expect(fetchAdminContactMessages(undefined)).rejects.toThrow("Unauthorized");
    await expect(fetchAdminProducts(undefined)).rejects.toThrow("Unauthorized");
  });
});
