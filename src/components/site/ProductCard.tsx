import { Link } from "@tanstack/react-router";
import { Leaf, MessageCircle, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cart, useCart } from "@/lib/enquiry-cart";
import { waLink } from "@/lib/site";

export type PublicProduct = {
  id: string; slug: string; name: string; category: string;
  short_description: string | null; description: string | null; pack_sizes: string | null; image_url: string | null;
};

export function ProductCard({ p }: { p: PublicProduct }) {
  const items = useCart();
  const added = items.some((i) => i.slug === p.slug);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-transform hover:-translate-y-1">
      <Link to="/products/$slug" params={{ slug: p.slug }} className="relative grid aspect-[4/3] place-items-center bg-soft">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-6" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-primary/70">
            <Leaf className="h-10 w-10" />
            <span className="font-display text-2xl text-primary">{p.name}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary">{p.category}</span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold text-foreground">{p.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.short_description || "Contact us for product details."}</p>
        {p.pack_sizes && <p className="mt-2 text-xs font-medium text-primary">Packs: {p.pack_sizes}</p>}
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="flex-1 rounded-full" variant={added ? "secondary" : "default"}
            onClick={() => { cart.add(p); toast.success(`${p.name} added to your enquiry list`); }}>
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{added ? "In enquiry" : "Request price"}
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" asChild>
            <a href={waLink(`Hello UN CROP CARE, I would like details about ${p.name}.`)} target="_blank" rel="noreferrer" aria-label={`WhatsApp about ${p.name}`}>
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
