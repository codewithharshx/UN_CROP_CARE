import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Leaf, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/public.functions";
import { cart } from "@/lib/enquiry-cart";
import { waLink } from "@/lib/site";
import { productsQuery } from "@/lib/queries";

const productQuery = (slug: string) => queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }) });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery);
    return { name: p.name, desc: p.short_description };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — UN CROP CARE` },
          { name: "description", content: loaderData.desc ?? `${loaderData.name} by UN CROP CARE.` },
          { property: "og:title", content: `${loaderData.name} — UN CROP CARE` },
          { property: "og:description", content: loaderData.desc ?? `${loaderData.name} by UN CROP CARE.` },
        ]
      : [{ title: "Product unavailable — UN CROP CARE" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-32 text-center">
        <h1 className="text-3xl font-semibold text-primary">Product not found</h1>
        <p className="mt-3 text-muted-foreground">The product you are looking for may have been updated or moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/products">Back to catalogue</Link>
          </Button>
          <Button asChild className="rounded-full">
            <a href={waLink("Hello UN CROP CARE, I am looking for a product.")} target="_blank" rel="noreferrer">
              Ask on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery);
  if (!p) return null;
  const related = all.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  return (
    <SiteLayout>
      <section className="container-page py-12">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />All products</Link>
        <div className="mt-8 grid gap-12 md:grid-cols-2">
          <div className="grid aspect-square place-items-center rounded-3xl bg-soft">
            {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-10" /> : <Leaf className="h-20 w-20 text-leaf" />}
          </div>
          <div>
            <p className="eyebrow">{p.category}</p>
            <h1 className="mt-3 text-5xl font-semibold text-primary">{p.name}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{p.short_description}</p>
            {p.description && <p className="mt-4 whitespace-pre-line text-foreground">{p.description}</p>}
            <dl className="mt-8 divide-y rounded-2xl border bg-card">
              <div className="flex justify-between p-4 text-sm"><dt className="text-muted-foreground">Pack sizes</dt><dd className="font-medium">{p.pack_sizes || "On request"}</dd></div>
              <div className="flex justify-between p-4 text-sm"><dt className="text-muted-foreground">Pricing</dt><dd className="font-semibold text-leaf">Contact for Price / Wholesale Quote</dd></div>
              <div className="flex justify-between p-4 text-sm"><dt className="text-muted-foreground">Usage & dosage</dt><dd className="font-medium">Ask our team</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" onClick={() => { cart.add(p); toast.success(`${p.name} added to your enquiry list`); }}><Plus className="h-4 w-4" />Add to enquiry</Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <a href={waLink(`Hello UN CROP CARE, I would like the price of ${p.name}.`)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />Ask on WhatsApp</a>
              </Button>
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-semibold text-primary">Related products</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
