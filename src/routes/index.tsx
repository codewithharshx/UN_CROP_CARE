import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sprout, Handshake, Leaf, PhoneCall } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/queries";
import { SITE } from "@/lib/site";
import farmer from "@/assets/field-farmer.jpg";
import soil from "@/assets/soil-hands.jpg";
import orchard from "@/assets/orchard-rows.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UN CROP CARE — Growing Together with Indian Farmers" },
      { name: "description", content: "Soil health and crop care products from UN CROP CARE, helping farmers move towards organic farming." },
      { property: "og:title", content: "UN CROP CARE — Working Together, Prosper Together" },
      { property: "og:description", content: "Soil Super Series and crop care products for farmers, dealers and distributors." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-deep text-deep-foreground">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div className="fade-up">
            <p className="font-marathi text-lime">{SITE.promiseMr}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] md:text-6xl">Growing together with India's farmers.</h1>
            <p className="mt-6 max-w-lg text-lg opacity-85">{SITE.mission} Soil health and crop care products, backed by people who answer the phone.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/products">Explore products <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-deep-foreground/40 bg-transparent text-deep-foreground hover:bg-deep-foreground/10 hover:text-deep-foreground"><Link to="/dealer">Become a dealer</Link></Button>
            </div>
          </div>
          <div className="relative fade-up">
            <img src="/images/banners/homepage-hero/uncropcare-hero-poster.jpg" alt="Farmer ploughing with bullocks behind the UN CROP CARE product range" className="w-full rounded-3xl object-contain shadow-soft bg-black/20" width={606} height={700} />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-20 md:grid-cols-2 md:items-center">
        <img src={soil} alt="Hands holding healthy soil with a seedling" className="aspect-square w-full rounded-3xl object-cover" loading="lazy" width={1024} height={1024} />
        <div>
          <p className="eyebrow">Who we are</p>
          <h2 className="mt-3 text-4xl font-semibold text-primary">Healthy soil first. Everything grows from there.</h2>
          <p className="mt-5 text-lg text-muted-foreground">UN CROP CARE is a biotechnology company working alongside farmers, retailers and distributors. Our focus is simple: help more farmers move towards organic farming practices, one field at a time.</p>
          <p className="font-marathi mt-4 text-primary">{SITE.taglineMr}</p>
          <Button asChild variant="link" className="mt-4 px-0 text-primary"><Link to="/about">Our story <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>

      <section className="bg-soft py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Our range</p>
              <h2 className="mt-3 text-4xl font-semibold text-primary">Featured products</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full"><Link to="/products">View all</Link></Button>
          </div>
          {products.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed bg-card/60 p-8 text-center sm:p-12">
              <Sprout className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-semibold text-primary">Product catalogue updating</h3>
              <p className="mt-2 mx-auto max-w-md text-sm text-muted-foreground">
                Our certified organic bio-fertilizer and crop care catalog is currently being updated. You can view our authentic formulations in the gallery or connect directly with our agricultural specialists.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/gallery">View field gallery</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <a href={SITE.whatsappHref} target="_blank" rel="noreferrer">
                    <PhoneCall className="h-4 w-4" /> WhatsApp enquiries
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-20">
        <p className="eyebrow">Why UN CROP CARE</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-primary">A partner in the field, not just a label on the shelf.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Sprout, t: "Organic-first thinking", d: "Products and guidance aimed at building soil health over time." },
            { icon: Handshake, t: "Working together", d: "We grow with our dealers and distributors, not around them." },
            { icon: PhoneCall, t: "Always reachable", d: "Call or WhatsApp our team for product guidance." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-7">
              <Icon className="h-6 w-6 text-leaf" />
              <h3 className="mt-4 font-sans text-lg font-bold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-4 pb-20 md:grid-cols-3">
        <img src={farmer} alt="Farmer in a sugarcane field" className="h-72 w-full rounded-2xl object-cover md:col-span-2" loading="lazy" width={1280} height={896} />
        <img src="/images/banners/company/product-range-lineup.webp" alt="UN CROP CARE authentic product packs" className="h-72 w-full rounded-2xl object-cover bg-white p-2 border" loading="lazy" />
        <img src={orchard} alt="Pomegranate and grape rows" className="h-72 w-full rounded-2xl object-cover md:col-span-3" loading="lazy" width={1280} height={896} />
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center">
          <div>
            <Leaf className="h-6 w-6 text-lime" />
            <h2 className="mt-3 text-3xl font-semibold">Let's grow together.</h2>
            <p className="mt-2 opacity-80">Talk to our team about products, pricing or a dealership.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full"><Link to="/contact">Contact our team</Link></Button>
            <Button asChild variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/dealer">Become a dealer</Link></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
