import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import farmer from "@/assets/field-farmer.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — UN CROP CARE" },
      { name: "description", content: "UN CROP CARE is a biotechnology company helping farmers move towards organic farming." },
      { property: "og:title", content: "About UN CROP CARE" },
      { property: "og:description", content: "Our mission, vision and farmer-first approach." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="About us" title="Working together, prospering together." intro={SITE.mission} />
      <section className="container-page grid gap-12 py-20 md:grid-cols-2">
        <img src={farmer} alt="Farmer standing in his field" className="w-full rounded-3xl object-cover" loading="lazy" width={1280} height={896} />
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-primary">Our story</h2>
            <p className="mt-3 text-muted-foreground">UN CROP CARE began with one belief: farmers do better when the people supplying them work alongside them. We build our range around soil health and organic farming practices.</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-primary">Mission</h2>
            <p className="mt-3 text-muted-foreground">To help more farmers move towards organic farming.</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-primary">Farmer-first</h2>
            <p className="font-marathi mt-3 text-lg text-primary">{SITE.promiseMr}</p>
            <p className="mt-1 text-muted-foreground">Always ready to serve farmers.</p>
          </div>
          <Button asChild className="rounded-full"><Link to="/contact">Talk to us</Link></Button>
        </div>
      </section>
      <section className="container-page pb-20">
        <div className="rounded-3xl border bg-card p-6 md:p-10 shadow-soft">
          <p className="eyebrow">Our Formulation Range</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary">Biotechnology Formulations for Healthy Crops</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            From our flagship Soil Super organic carbon conditioner to specialized formulations like Volvo Super, Martin Gold, and Recover, each product is developed for sustainable yield.
          </p>
          <img
            src="/images/banners/company/product-range-lineup.webp"
            alt="UN CROP CARE formulation lineup"
            className="mt-8 w-full rounded-2xl object-cover bg-white p-4 border"
            loading="lazy"
          />
        </div>
      </section>
    </SiteLayout>
  );
}
