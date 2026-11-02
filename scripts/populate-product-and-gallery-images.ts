// UN CROP CARE — Populate Verified Brand, Product & Gallery Images into PostgreSQL
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import * as schema from "../drizzle/schema";

const PRODUCT_IMAGE_MAPPINGS: Record<
  string,
  {
    primaryUrl: string;
    altText: string;
    additionalImages?: Array<{ url: string; altText: string }>;
  }
> = {
  "soil-super": {
    primaryUrl: "/images/products/soil-super/primary.webp",
    altText: "Soil Super Organic Carbon Soil Conditioner packaging",
    additionalImages: [
      {
        url: "/images/products/soil-super/soil-super-infographic.jpg",
        altText: "Soil Super Benefits and Marathi product specification",
      },
    ],
  },
  "soil-super-granules": {
    primaryUrl: "/images/products/soil-super-granules/primary.webp",
    altText: "Soil Super Granules agricultural packaging",
    additionalImages: [
      {
        url: "/images/products/soil-super-granules/soil-super-granules-bag.jpg",
        altText: "Soil Super Granules original bag photography",
      },
    ],
  },
  "volvo-super": {
    primaryUrl: "/images/products/volvo-super/primary.webp",
    altText: "Volvo Super Bio-Nutrient packaging",
  },
  "martin-gold": {
    primaryUrl: "/images/products/martin-gold/primary.webp",
    altText: "Martin Gold Crop Nutrition formula canister",
  },
  "robust": {
    primaryUrl: "/images/products/robust/primary.webp",
    altText: "Robust Plant Health packaging",
  },
  "recover": {
    primaryUrl: "/images/products/recover/primary.webp",
    altText: "Recover Stress Recovery formula bottle",
  },
  "un-zyme": {
    primaryUrl: "/images/products/un-zyme/primary.webp",
    altText: "UN-Zyme Enzymatic agricultural formula jar",
  },
  "un-saf": {
    primaryUrl: "/images/products/un-saf/primary.webp",
    altText: "UN-Saf Crop Defense packaging",
  },
};

const GALLERY_IMAGES = [
  {
    title: "Farmer in Field with Product",
    altText: "Farmer inspecting crops with UN CROP CARE solution",
    imageUrl: "/images/gallery/farms/farmer-with-product.jpg",
    category: "Farms",
    sortOrder: 1,
  },
  {
    title: "Soil Super Field Application",
    altText: "Farmer applying Soil Super organic carbon to farmland",
    imageUrl: "/images/gallery/farms/farmer-applying-soil-super.jpg",
    category: "Farms",
    sortOrder: 2,
  },
  {
    title: "Vibrant Capsicum Crop",
    altText: "Healthy green capsicum bell pepper crop cultivated with organic nutrition",
    imageUrl: "/images/gallery/farms/capsicum-crop-health.jpg",
    category: "Farms",
    sortOrder: 3,
  },
  {
    title: "Trellised Vineyard Orchard",
    altText: "Modern high-yield trellised vineyard under UN CROP CARE regime",
    imageUrl: "/images/gallery/farms/vineyard-plantation.jpg",
    category: "Farms",
    sortOrder: 4,
  },
  {
    title: "Prosperous Harvest",
    altText: "Happy Indian farmer smiling during successful harvest",
    imageUrl: "/images/gallery/farms/farmer-field-harvest.jpg",
    category: "Farms",
    sortOrder: 5,
  },
  {
    title: "Complete Product Range Lineup",
    altText: "Complete UN CROP CARE organic farming product lineup",
    imageUrl: "/images/banners/company/product-range-lineup.webp",
    category: "Products",
    sortOrder: 6,
  },
  {
    title: "Farmer Plowing Field Under Sunset",
    altText: "Traditional Indian farmer plowing fertile black soil with bullocks",
    imageUrl: "/images/banners/homepage-hero/farmer-plowing-hero.webp",
    category: "Company",
    sortOrder: 7,
  },
];

async function populateImages() {
  console.log("==================================================");
  console.log("UN CROP CARE: Populating Verified Images in PostgreSQL");
  console.log("==================================================");

  // 1. Fetch all products from database
  const dbProducts = await db.select().from(schema.products);
  console.log(`Found ${dbProducts.length} products in database.`);

  await db.transaction(async (tx) => {
    // 2. Update each product's image_url and sync product_images table
    for (const prod of dbProducts) {
      const mapping = PRODUCT_IMAGE_MAPPINGS[prod.slug];
      if (!mapping) {
        console.warn(`No mapping found for slug '${prod.slug}', skipping.`);
        continue;
      }

      // Update products table
      await tx
        .update(schema.products)
        .set({
          imageUrl: mapping.primaryUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, prod.id));

      // Clear existing product_images for this product to prevent duplicate stacking
      await tx
        .delete(schema.productImages)
        .where(eq(schema.productImages.productId, prod.id));

      // Insert primary image
      await tx.insert(schema.productImages).values({
        productId: prod.id,
        url: mapping.primaryUrl,
        altText: mapping.altText,
        isPrimary: true,
        sortOrder: 0,
      });

      // Insert additional images if present
      if (mapping.additionalImages) {
        let order = 1;
        for (const addImg of mapping.additionalImages) {
          await tx.insert(schema.productImages).values({
            productId: prod.id,
            url: addImg.url,
            altText: addImg.altText,
            isPrimary: false,
            sortOrder: order++,
          });
        }
      }

      console.log(`[OK] Product '${prod.name}' (${prod.slug}) -> ${mapping.primaryUrl}`);
    }

    // 3. Populate Gallery Images
    await tx.delete(schema.galleryImages); // Clean refresh
    for (const g of GALLERY_IMAGES) {
      await tx.insert(schema.galleryImages).values({
        title: g.title,
        altText: g.altText,
        imageUrl: g.imageUrl,
        category: g.category,
        sortOrder: g.sortOrder,
        isPublic: true,
      });
      console.log(`[OK] Gallery Image '${g.title}' -> ${g.imageUrl}`);
    }
  });

  console.log("\n==================================================");
  console.log("[SUCCESS] All product images & gallery records synced to PostgreSQL!");
  console.log("==================================================");
  process.exit(0);
}

populateImages().catch((err) => {
  console.error("Failed to populate images:", err);
  process.exit(1);
});

