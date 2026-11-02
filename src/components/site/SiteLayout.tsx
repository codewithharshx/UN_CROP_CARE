import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, Phone, Mail, MessageCircle, ShoppingBag, Facebook } from "lucide-react";
import { SITE } from "@/lib/site";
import { useCart } from "@/lib/enquiry-cart";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/products", label: "Products" },
  { to: "/crop-solutions", label: "Crop Solutions" },
  { to: "/gallery", label: "Gallery" },
  { to: "/dealer", label: "Become a Dealer" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = useCart();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-deep text-deep-foreground text-xs">
        <div className="container-page flex h-9 items-center justify-between gap-4">
          <span className="font-marathi hidden sm:inline">{SITE.promiseMr}</span>
          <div className="flex items-center gap-5">
            <a href={SITE.phoneHref} className="flex items-center gap-1.5 hover:text-lime"><Phone className="h-3.5 w-3.5" />{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`} className="hidden items-center gap-1.5 hover:text-lime md:flex"><Mail className="h-3.5 w-3.5" />{SITE.email}</a>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/brand/uncrop-care-logo.png" alt="UN CROP CARE logo" className="h-12 w-12 rounded-full object-contain shadow-sm" />
            <span className="font-display text-lg font-semibold leading-none text-primary">UN CROP CARE</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[status=active]:bg-soft data-[status=active]:text-primary">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/enquiry" className="relative rounded-full p-2.5 text-primary hover:bg-soft" aria-label="Enquiry list">
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{items.length}</span>}
            </Link>
            <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
              <a href={SITE.whatsappHref} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a>
            </Button>
            <button className="rounded-full p-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t lg:hidden">
            <div className="container-page flex flex-col py-3">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-soft">{n.label}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-deep text-deep-foreground">
        <div className="container-page grid gap-10 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/images/brand/uncrop-care-logo.png" alt="UN CROP CARE logo" className="h-14 w-14 rounded-full bg-white p-1 object-contain shadow-sm" />
              <span className="font-display text-xl">UN CROP CARE</span>
            </div>
            <p className="mt-4 max-w-sm text-sm opacity-80">{SITE.mission}</p>
            <p className="font-marathi mt-2 text-sm text-lime">{SITE.taglineMr}</p>
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-lime">Explore</h4>
            <ul className="mt-4 space-y-2 text-sm opacity-85">
              {NAV.slice(1).map((n) => <li key={n.to}><Link to={n.to} className="hover:text-lime">{n.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-lime">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm opacity-85">
              <li><a href={SITE.phoneHref} className="flex items-center gap-2 hover:text-lime"><Phone className="h-4 w-4" />{SITE.phone}</a></li>
              <li><a href={SITE.whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-lime"><MessageCircle className="h-4 w-4" />{SITE.whatsapp}</a></li>
              <li><a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-lime"><Mail className="h-4 w-4" />{SITE.email}</a></li>
              <li><a href={SITE.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-lime"><Facebook className="h-4 w-4" />Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-deep-foreground/15">
          <div className="container-page flex flex-col justify-between gap-2 py-5 text-xs opacity-70 sm:flex-row">
            <span>© {new Date().getFullYear()} UN CROP CARE. {SITE.tagline}</span>
            <Link to="/auth" className="hover:text-lime">Staff login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="bg-soft">
      <div className="container-page py-16 md:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-primary md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
      </div>
    </section>
  );
}
