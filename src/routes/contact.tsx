import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, MessageCircle, Phone, Facebook } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Field, zodErrors } from "@/components/site/Field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { contactSchema, submitContact } from "@/lib/public.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UN CROP CARE" },
      { name: "description", content: "Call, WhatsApp or email UN CROP CARE, or send us a message." },
      { property: "og:title", content: "Contact UN CROP CARE" },
      { property: "og:description", content: "Reach our team by phone, WhatsApp or email." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(zodErrors(parsed.error.issues));
    setErrors({}); setBusy(true);
    try { await submitContact({ data: parsed.data }); setDone(true); }
    catch { toast.error("Could not send. Please try again or call us."); }
    finally { setBusy(false); }
  }
  const channels = [
    { icon: Phone, l: "Call", v: SITE.phone, href: SITE.phoneHref },
    { icon: MessageCircle, l: "WhatsApp", v: SITE.whatsapp, href: SITE.whatsappHref },
    { icon: Mail, l: "Email", v: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Facebook, l: "Facebook", v: "facebook.com/uncropcare", href: SITE.facebook },
  ];
  return (
    <SiteLayout>
      <PageHeader eyebrow="Contact" title="We're here to help." intro="Questions about products, prices or orders — reach out any way you like." />
      <section className="container-page grid gap-10 py-16 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          {channels.map(({ icon: Icon, l, v, href }) => (
            <a key={l} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-primary">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-soft text-primary"><Icon className="h-5 w-5" /></span>
              <span><span className="block text-xs text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></span>
            </a>
          ))}
        </div>
        {done ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-leaf" />
            <h2 className="mt-4 text-3xl font-semibold text-primary">Message sent</h2>
            <p className="mt-2 text-muted-foreground">Thank you. We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border bg-card p-8 sm:grid-cols-2">
            <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <Field label="Name" name="name" error={errors.name} required><Input id="name" name="name" maxLength={100} /></Field>
            <Field label="Mobile" name="phone" error={errors.phone} required><Input id="phone" name="phone" type="tel" maxLength={20} /></Field>
            <Field label="Email" name="email" error={errors.email}><Input id="email" name="email" type="email" maxLength={255} /></Field>
            <Field label="Subject" name="subject" error={errors.subject}><Input id="subject" name="subject" maxLength={150} /></Field>
            <div className="sm:col-span-2"><Field label="Message" name="message" error={errors.message} required><Textarea id="message" name="message" rows={5} maxLength={1000} /></Field></div>
            <Button type="submit" size="lg" className="rounded-full sm:col-span-2" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
