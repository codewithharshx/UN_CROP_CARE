// UN CROP CARE — Verified Demo Product Catalogue Data
// Used as high-availability fallback when remote database is unconfigured or temporarily offline

export interface DemoProduct {
  id: string;
  slug: string;
  name: string;
  category: "Soil Health" | "Crop Nutrition" | "Crop Protection";
  short_description: string;
  description: string;
  pack_sizes: string;
  image_url: string;
  status: "published";
  is_public: boolean;
  sort_order: number;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "a0e436a3-42de-4e34-8c94-aa96823406dc",
    slug: "soil-super",
    name: "Soil Super",
    category: "Soil Health",
    short_description: "Organic carbon soil conditioner from the Soil Super Series.",
    description:
      "Soil Super is an advanced organic carbon soil conditioner formulated to restore degraded soils, optimize soil pore space, and improve cation exchange capacity (CEC). By revitalizing the rhizosphere with organic matter, it stimulates indigenous beneficial microflora, improves moisture retention in arid conditions, and maximizes fertilizer uptake across sugarcane, cotton, soybean, fruits, and vegetables.",
    pack_sizes: "25 kg Bag, 50 kg Bag",
    image_url: "/images/products/soil-super/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 1,
  },
  {
    id: "9a4713c2-eeba-4572-8386-c3f0c4cb5b8a",
    slug: "soil-super-granules",
    name: "Soil Super Granules",
    category: "Soil Health",
    short_description: "Granular format in the Soil Super Series for direct broadcasting.",
    description:
      "Engineered in convenient uniform granular format for basal application and broadcast dressing. Soil Super Granules release organic carbon compounds directly into the root zone over an extended duration. Promotes healthy root branching, reduces fertilizer leaching, and enhances soil crumb structure in heavy clay and light sandy soils.",
    pack_sizes: "10 kg Bag, 25 kg Bag",
    image_url: "/images/products/soil-super-granules/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 2,
  },
  {
    id: "743b69bd-d587-4663-93fd-b682af68f37a",
    slug: "volvo-super",
    name: "Volvo Super",
    category: "Soil Health",
    short_description: "Organic carbon plant vitalizer and bio-stimulant for vegetative vigor.",
    description:
      "Volvo Super is a high-grade organic carbon liquid vitalizer and natural plant bio-stimulant. It accelerates cell elongation, promotes lush foliage growth, and assists crops in weathering climatic stress such as unexpected temperature swings and dry spells. Suitable for foliar spraying and fertigation via drip irrigation.",
    pack_sizes: "500 ml, 1 Litre, 5 Litres",
    image_url: "/images/products/volvo-super/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 3,
  },
  {
    id: "13ba8c3d-e715-46b8-a34f-b82f59677345",
    slug: "martin-gold",
    name: "Martin Gold",
    category: "Crop Nutrition",
    short_description: "Soil conditioner & high-potency crop nutrition formula for enhanced yields.",
    description:
      "Martin Gold supplies balanced organic plant nutrients that enrich chlorophyll synthesis and boost photosynthetic output. Formulated to encourage vigorous branching, synchronized flowering, and uniform fruit and grain development with reduced fruit drop.",
    pack_sizes: "1 Litre, 5 Litres, 20 Litres",
    image_url: "/images/products/martin-gold/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 4,
  },
  {
    id: "c54606df-8154-48c6-aa52-e8053da44bb9",
    slug: "robust",
    name: "Robust",
    category: "Crop Nutrition",
    short_description: "Plant vigor booster & biological crop shield for resilient growth.",
    description:
      "Robust fortifies crop stamina and builds natural structural vigor. It reinforces cell wall integrity, enhances secondary nutrient transportation, and provides crops with biological defense mechanisms to maintain peak productivity throughout the vegetative and reproductive phases.",
    pack_sizes: "250 ml, 500 ml, 1 Litre",
    image_url: "/images/products/robust/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 5,
  },
  {
    id: "310afcad-210d-416d-ae4b-710386a6858c",
    slug: "recover",
    name: "Recover",
    category: "Crop Protection",
    short_description: "Abiotic and biotic stress recovery formula for quick crop revival.",
    description:
      "Recover is specialized for rapid crop recovery following severe moisture stress, water stagnation, pesticide shock, or adverse weather conditions. It stimulates metabolic revival, re-establishes root sap flow, and helps plants resume vigorous green growth quickly.",
    pack_sizes: "500 ml, 1 Litre",
    image_url: "/images/products/recover/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 6,
  },
  {
    id: "fab4df3d-6363-492c-b5de-9a1fbcba9db1",
    slug: "un-zyme",
    name: "UN-Zyme",
    category: "Crop Nutrition",
    short_description: "Multi-enzyme bio-extract catalyzing nutrient uptake and root development.",
    description:
      "A concentrated enzymatic formulation derived from botanical bio-ferments. UN-Zyme activates enzymes responsible for nutrient uptake in soil and plant tissue, facilitating the solubilization of insoluble phosphorus and essential micronutrients. Results in dense white feeder root proliferation and vigorous early establishment.",
    pack_sizes: "100 g, 250 g, 500 g",
    image_url: "/images/products/un-zyme/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 7,
  },
  {
    id: "dc19c74f-ded4-498a-b244-69190cabd8a7",
    slug: "un-saf",
    name: "UN-Saf",
    category: "Crop Protection",
    short_description: "Specialized eco-friendly crop protection and defense formula.",
    description:
      "UN-Saf delivers proactive, eco-friendly crop defense designed for organic and integrated pest management (IPM) systems. Free from harmful chemical residues, it preserves natural predators, beneficial pollinators, and earthworms while supporting comprehensive crop health.",
    pack_sizes: "250 ml, 500 ml, 1 Litre",
    image_url: "/images/products/un-saf/primary.webp",
    status: "published",
    is_public: true,
    sort_order: 8,
  },
];
