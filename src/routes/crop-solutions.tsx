import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/site";
import soil from "@/assets/soil-hands.jpg";
import orchard from "@/assets/orchard-rows.jpg";
import farmer from "@/assets/field-farmer.jpg";

export const Route = createFileRoute("/crop-solutions")({
  head: () => ({
    meta: [
      { title: "Crop Solutions — UN CROP CARE" },
      { name: "description", content: "Talk to UN CROP CARE about soil health and crop care for your crops." },
      { property: "og:title", content: "Crop Solutions — UN CROP CARE" },
      { property: "og:description", content: "Soil health, field crops and horticulture guidance from our team." },
    ],
  }),
  component: Crops,
});

const AREAS = [
  { img: soil, t: "Soil health", d: "Improving organic carbon and soil structure is where our Soil Super Series focuses." },
  { img: farmer, t: "Field crops", d: "Sugarcane, cotton, soybean and other field crops. Ask us which products suit your farm." },
  { img: orchard, t: "Horticulture", d: "Grapes, pomegranate, vegetables and orchards. Share your concern and we'll guide you." },
];

function Crops() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Crop solutions" title="Tell us your crop. We'll suggest the right approach." intro="Product recommendations are given by our team based on your crop, soil and season." />
      <section className="container-page grid gap-6 py-16 md:grid-cols-3">
        {AREAS.map((a) => (
          <article key={a.t} className="overflow-hidden rounded-2xl border bg-card">
            <img src={a.img} alt={a.t} className="h-56 w-full object-cover" loading="lazy" />
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-primary">{a.t}</h2>
              <p className="mt-2 text-muted-foreground">{a.d}</p>
              <Button asChild variant="outline" className="mt-5 rounded-full">
                <a href={waLink(`Hello UN CROP CARE, I need guidance for ${a.t.toLowerCase()}.`)} target="_blank" rel="noreferrer">Ask on WhatsApp</a>
              </Button>
            </div>
          </article>
        ))}
      </section>
      <div className="container-page pb-20 text-center">
        <Button asChild className="rounded-full"><Link to="/products">Browse products</Link></Button>
      </div>
    </SiteLayout>
  );
}
