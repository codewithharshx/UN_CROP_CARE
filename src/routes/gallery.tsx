import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import soil from "@/assets/soil-hands.jpg";
import orchard from "@/assets/orchard-rows.jpg";
import farmer from "@/assets/field-farmer.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — UN CROP CARE" },
      { name: "description", content: "Photos of UN CROP CARE products, farms and farmers." },
      { property: "og:title", content: "Gallery — UN CROP CARE" },
      { property: "og:description", content: "Products, fields and farmers we work with." },
    ],
  }),
  component: Gallery,
});

const IMGS = [
  { src: "/images/banners/homepage-hero/uncropcare-hero-poster.jpg", alt: "UN CROP CARE master agricultural banner" },
  { src: "/images/gallery/farms/farmer-with-product.jpg", alt: "Farmer in lush field holding UN CROP CARE formula" },
  { src: "/images/gallery/farms/farmer-applying-soil-super.jpg", alt: "Farmer applying Soil Super organic carbon to soil" },
  { src: "/images/gallery/farms/capsicum-crop-health.jpg", alt: "Vibrant capsicum crop cultivated with organic nutrition" },
  { src: "/images/gallery/farms/vineyard-plantation.jpg", alt: "Modern trellised vineyard orchard" },
  { src: "/images/gallery/farms/farmer-field-harvest.jpg", alt: "Indian farmer celebrating prosperous agricultural yield" },
  { src: "/images/banners/company/product-range-lineup.webp", alt: "Complete UN CROP CARE agricultural product lineup" },
  { src: "/images/brand/uncrop-care-logo.png", alt: "Official UN CROP CARE logo emblem" },
  { src: farmer, alt: "Farmer in sugarcane field" },
  { src: soil, alt: "Healthy organic soil with seedling" },
  { src: orchard, alt: "Pomegranate and grape rows" },
];

function Gallery() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Gallery" title="From our fields" />
      <section className="container-page columns-1 gap-4 py-16 sm:columns-2 lg:columns-3">
        {IMGS.map((i) => (
          <img
            key={i.alt}
            src={i.src}
            alt={i.alt}
            loading="lazy"
            className="mb-4 w-full break-inside-avoid rounded-2xl bg-soft object-cover shadow-soft"
          />
        ))}
      </section>
    </SiteLayout>
  );
}
