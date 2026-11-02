import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Field, zodErrors } from "@/components/site/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cart, useCart } from "@/lib/enquiry-cart";
import { enquirySchema, submitEnquiry } from "@/lib/public.functions";

export const Route = createFileRoute("/enquiry")({
  head: () => ({
    meta: [
      { title: "Your Enquiry — UN CROP CARE" },
      { name: "description", content: "Send your product enquiry to UN CROP CARE and receive a reference number." },
      { property: "og:title", content: "Product Enquiry — UN CROP CARE" },
      { property: "og:description", content: "Request prices for UN CROP CARE products." },
    ],
  }),
  component: Enquiry,
});

function Enquiry() {
  const items = useCart();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = enquirySchema.safeParse({ ...Object.fromEntries(new FormData(e.currentTarget)), items });
    if (!parsed.success) return setErrors(zodErrors(parsed.error.issues));
    setErrors({}); setBusy(true);
    try { const r = await submitEnquiry({ data: parsed.data }); setRef(r.reference); cart.clear(); }
    catch { toast.error("Could not submit. Please try again or call us."); }
    finally { setBusy(false); }
  }

  if (ref) return (
    <SiteLayout>
      <div className="container-page max-w-xl py-24 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-leaf" />
        <h1 className="mt-4 text-4xl font-semibold text-primary">Enquiry sent</h1>
        <p className="mt-3 text-muted-foreground">Your reference number is</p>
        <p className="mt-1 font-mono text-2xl font-bold text-primary">{ref}</p>
        <p className="mt-3 text-muted-foreground">Our team will contact you with prices and availability.</p>
        <Button asChild className="mt-8 rounded-full"><Link to="/products">Continue browsing</Link></Button>
      </div>
    </SiteLayout>
  );

  return (
    <SiteLayout>
      <PageHeader eyebrow="Enquiry" title="Request prices" intro="Review your products, then tell us how to reach you." />
      <section className="container-page grid gap-10 py-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Products</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No products added yet. You can still send a general enquiry, or <Link to="/products" className="text-primary underline">browse products</Link>.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.slug} className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
                  <span className="min-w-32 flex-1 font-semibold">{i.name}</span>
                  <label className="text-xs text-muted-foreground">Qty<Input value={i.quantity} maxLength={30} onChange={(e) => cart.update(i.slug, { quantity: e.target.value })} className="mt-1 w-20" /></label>
                  <label className="text-xs text-muted-foreground">Pack size<Input value={i.pack} maxLength={60} placeholder="e.g. 1 kg" onChange={(e) => cart.update(i.slug, { pack: e.target.value })} className="mt-1 w-28" /></label>
                  <Button variant="ghost" size="icon" onClick={() => cart.remove(i.slug)} aria-label={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-7">
          <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <Field label="Name" name="name" error={errors.name} required><Input id="name" name="name" maxLength={100} /></Field>
          <Field label="Mobile" name="phone" error={errors.phone} required><Input id="phone" name="phone" type="tel" maxLength={20} /></Field>
          <Field label="Email" name="email" error={errors.email}><Input id="email" name="email" type="email" maxLength={255} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Village / City" name="location" error={errors.location}><Input id="location" name="location" maxLength={150} /></Field>
            <Field label="PIN code" name="pin_code" error={errors.pin_code}><Input id="pin_code" name="pin_code" maxLength={10} /></Field>
          </div>
          <Field label="Message" name="message" error={errors.message}><Textarea id="message" name="message" rows={3} maxLength={1000} /></Field>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</Button>
        </form>
      </section>
    </SiteLayout>
  );
}
