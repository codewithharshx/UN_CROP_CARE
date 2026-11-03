import { Link } from "@tanstack/react-router";
import { Leaf, MessageCircle, Plus, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cart, useCart } from "@/lib/enquiry-cart";
import { waLink } from "@/lib/site";

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string | null;
  description: string | null;
  pack_sizes: string | null;
  image_url: string | null;
};

export function ProductCard({ p }: { p: PublicProduct }) {
  const items = useCart();
  const added = items.some((i) => i.slug === p.slug);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <Link
        to="/products/$slug"
        params={{ slug: p.slug }}
        className="relative grid aspect-[4/3] place-items-center bg-soft p-4 transition-colors group-hover:bg-soft/80"
      >
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-primary/70">
            <Leaf className="h-10 w-10 text-leaf" />
            <span className="font-display text-2xl text-primary">{p.name}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary shadow-xs backdrop-blur">
          {p.category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to="/products/$slug" params={{ slug: p.slug }} className="transition-colors hover:text-primary">
          <h3 className="text-xl font-semibold text-foreground">{p.name}</h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {p.short_description || "Contact us for product details."}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="font-medium text-primary">
            {p.pack_sizes ? `Packs: ${p.pack_sizes}` : "Packs: On request"}
          </span>
          <span className="font-semibold text-leaf">Contact for Price</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="flex-1 rounded-full border-primary/25 text-xs hover:bg-primary/5 hover:text-primary"
          >
            <Link to="/products/$slug" params={{ slug: p.slug }}>
              View Details <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-full text-xs"
            variant={added ? "secondary" : "default"}
            onClick={() => {
              cart.add(p);
              toast.success(`${p.name} added to your enquiry list`);
            }}
          >
            {added ? <Check className="mr-1 h-3.5 w-3.5" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
            {added ? "In enquiry" : "Add to Enquiry"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:text-primary"
            asChild
          >
            <a
              href={waLink(`Hello UN CROP CARE, I would like details about ${p.name}.`)}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp about ${p.name}`}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
