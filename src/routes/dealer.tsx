import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Field, zodErrors } from "@/components/site/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { dealerSchema, submitDealer } from "@/lib/public.functions";

export const Route = createFileRoute("/dealer")({
  head: () => ({
    meta: [
      { title: "Become a Dealer — UN CROP CARE" },
      { name: "description", content: "Apply to become a UN CROP CARE dealer or distributor." },
      { property: "og:title", content: "Become a UN CROP CARE Dealer" },
      { property: "og:description", content: "Partner with UN CROP CARE as a dealer or distributor." },
    ],
  }),
  component: Dealer,
});

const FIELDS: { n: string; l: string; req?: boolean; type?: string }[] = [
  { n: "applicant_name", l: "Your name", req: true },
  { n: "business_name", l: "Business name", req: true },
  { n: "mobile", l: "Mobile number", req: true, type: "tel" },
  { n: "whatsapp", l: "WhatsApp number", type: "tel" },
  { n: "email", l: "Email", type: "email" },
  { n: "business_type", l: "Business type (retailer, distributor…)" },
  { n: "city", l: "City", req: true },
  { n: "state", l: "State", req: true },
  { n: "pin_code", l: "PIN code" },
  { n: "experience_years", l: "Years in agri business" },
];

function Dealer() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = dealerSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodErrors(parsed.error.issues));
    setErrors({}); setBusy(true);
    try { await submitDealer({ data: parsed.data }); setDone(true); }
    catch { toast.error("Could not submit. Please try again or call us."); }
    finally { setBusy(false); }
  }
  return (
    <SiteLayout>
      <PageHeader eyebrow="Partner with us" title="Become a dealer or distributor" intro="Share a few details and our team will get in touch." />
      <section className="container-page max-w-3xl py-16">
        {done ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-leaf" />
            <h2 className="mt-4 text-3xl font-semibold text-primary">Application received</h2>
            <p className="mt-2 text-muted-foreground">Thank you. Our team will contact you soon.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border bg-card p-8 sm:grid-cols-2">
            <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {FIELDS.map((f) => (
              <Field key={f.n} label={f.l} name={f.n} error={errors[f.n]} required={f.req}>
                <Input id={f.n} name={f.n} type={f.type ?? "text"} maxLength={150} />
              </Field>
            ))}
            <div className="sm:col-span-2"><Field label="Current dealerships" name="current_dealership" error={errors.current_dealership}><Input id="current_dealership" name="current_dealership" maxLength={300} /></Field></div>
            <div className="sm:col-span-2"><Field label="Message" name="message" error={errors.message}><Textarea id="message" name="message" maxLength={1000} rows={4} /></Field></div>
            <Button type="submit" size="lg" className="rounded-full sm:col-span-2" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
