import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products — UN CROP CARE" },
      { name: "description", content: "Browse the UN CROP CARE range including the Soil Super Series. Request prices online or on WhatsApp." },
      { property: "og:title", content: "UN CROP CARE Products" },
      { property: "og:description", content: "Soil health, crop nutrition and crop protection products." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Products,
});

function Products() {
  const { data } = useSuspenseQuery(productsQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("featured");
  const cats = ["All", ...Array.from(new Set(data.map((p) => p.category)))];
  const list = useMemo(() => {
    let l = data.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "az") l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [data, q, cat, sort]);
  return (
    <SiteLayout>
      <PageHeader eyebrow="Catalogue" title="Our products" intro="Add products to your enquiry list and we'll send you prices and availability." />
      <section className="container-page py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-56 rounded-full pl-9" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border bg-card px-4 text-sm">
              <option value="featured">Featured</option>
              <option value="az">Name A–Z</option>
            </select>
          </div>
        </div>
        {list.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed bg-card/60 py-20 px-4 text-center">
            <p className="text-muted-foreground">
              {q || cat !== "All"
                ? "No products match your search."
                : "Product catalogue is currently being synchronized. Please contact our team via WhatsApp for pricing and availability."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={SITE.whatsappHref} target="_blank" rel="noreferrer">
                  Contact on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
