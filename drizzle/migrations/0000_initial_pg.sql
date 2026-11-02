CREATE TYPE "public"."enquiry_status" AS ENUM('New', 'Contacted', 'Quotation Sent', 'Negotiation', 'Approved', 'Converted to Order', 'Rejected', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('super_admin', 'business_admin', 'manager', 'accountant', 'sales_executive', 'inventory_manager', 'billing_staff');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('New', 'Reviewed', 'In Progress', 'Archived');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"company_name" text DEFAULT 'UN CROP CARE' NOT NULL,
	"tagline" text DEFAULT 'Working Together, Prosper Together.',
	"tagline_marathi" text DEFAULT 'एकत्र काम करूया, एकत्र प्रगती करूया.',
	"promise_marathi" text DEFAULT 'शेतकऱ्यांच्या सेवेसाठी सदैव तत्पर',
	"mission" text DEFAULT 'Working to help more farmers move towards organic farming.',
	"phone" text DEFAULT '0788 732 7272',
	"phone_href" text DEFAULT 'tel:+917887327272',
	"whatsapp" text DEFAULT '+91 788 732 7272',
	"whatsapp_href" text DEFAULT 'https://wa.me/917887327272',
	"email" text DEFAULT 'info@uncropcare.in',
	"facebook" text DEFAULT 'https://www.facebook.com/uncropcare/',
	"address" text,
	"gstin" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"subject" text,
	"message" text NOT NULL,
	"status" "submission_status" DEFAULT 'New' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_name" text NOT NULL,
	"business_name" text NOT NULL,
	"mobile" text NOT NULL,
	"whatsapp" text,
	"email" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pin_code" text,
	"business_type" text,
	"current_dealership" text,
	"experience_years" text,
	"message" text,
	"status" "submission_status" DEFAULT 'New' NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"location" text,
	"pin_code" text,
	"message" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "enquiry_status" DEFAULT 'New' NOT NULL,
	"assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "enquiry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"product_id" uuid,
	"product_slug" text NOT NULL,
	"product_name" text NOT NULL,
	"quantity" text NOT NULL,
	"pack_size" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"alt_text" text NOT NULL,
	"image_url" text NOT NULL,
	"category" text DEFAULT 'Farm',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Crop Care' NOT NULL,
	"category_id" uuid,
	"short_description" text,
	"description" text,
	"pack_sizes" text,
	"image_url" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"base_price" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"assigned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_applications" ADD CONSTRAINT "dealer_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_items" ADD CONSTRAINT "enquiry_items_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_items" ADD CONSTRAINT "enquiry_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_msgs_created_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_msgs_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dealer_apps_created_idx" ON "dealer_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dealer_apps_status_idx" ON "dealer_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_ref_idx" ON "enquiries" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enquiries_created_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiry_items_enquiry_idx" ON "enquiry_items" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "gallery_sort_idx" ON "gallery_images" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "product_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_sort_idx" ON "products" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_visibility_idx" ON "products" USING btree ("is_public","status");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique_idx" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");

--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "enquiry_seq" START 1001;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "reference" SET DEFAULT ('UNC-' || nextval('enquiry_seq'));--> statement-breakpoint
INSERT INTO "products" ("slug", "name", "category", "short_description", "status", "is_public", "sort_order")
VALUES
  ('soil-super', 'Soil Super', 'Soil Health', 'Organic carbon soil conditioner from the Soil Super Series.', 'published', true, 1),
  ('soil-super-granules', 'Soil Super Granules', 'Soil Health', 'Granular format in the Soil Super Series.', 'published', true, 2),
  ('volvo-super', 'Volvo Super', 'Soil Health', 'Organic carbon product. Contact us for full details.', 'published', true, 3),
  ('martin-gold', 'Martin Gold', 'Crop Nutrition', 'Contact us for full product details.', 'published', true, 4),
  ('robust', 'Robust', 'Crop Nutrition', 'Contact us for full product details.', 'published', true, 5),
  ('recover', 'Recover', 'Crop Protection', 'Contact us for full product details.', 'published', true, 6),
  ('un-zyme', 'UN-Zyme', 'Crop Nutrition', 'Contact us for full product details.', 'published', true, 7),
  ('un-saf', 'UN-Saf', 'Crop Protection', 'Contact us for full product details.', 'published', true, 8)
ON CONFLICT ("slug") DO NOTHING;
