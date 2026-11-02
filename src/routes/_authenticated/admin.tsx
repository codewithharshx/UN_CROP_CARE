import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Shield, UserPlus, CheckCircle2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminEnquiriesFn,
  updateEnquiryStatusFn,
  getAdminDealersFn,
  getAdminContactMessagesFn,
  getAdminProductsFn,
  updateAdminProductFn,
  createAdminProductFn,
  uploadAssetFn,
} from "@/lib/admin.functions";
import { signOut } from "@/lib/auth-client";
import { assignStaffRoleFn } from "@/lib/auth.functions";
import { STAFF_ROLES, formatRoleLabel, StaffRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard — UN CROP CARE" },
      { name: "description", content: "Manage enquiries, dealer applications, products, and staff roles." },
      { property: "og:title", content: "Staff Dashboard — UN CROP CARE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

const STATUSES = [
  "New",
  "Contacted",
  "Quotation Sent",
  "Negotiation",
  "Approved",
  "Converted to Order",
  "Rejected",
  "Closed",
];

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Admin() {
  const context = Route.useRouteContext();
  const user = context.user;
  const isStaff = context.isStaff;
  const isSuperAdmin = context.isSuperAdmin;
  const roles = context.roles || [];
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      window.location.href = "/auth";
    } catch (err: any) {
      toast.error(err.message || "Error signing out");
    }
  }

  return (
    <div className="min-h-screen bg-soft">
      <header className="border-b bg-card">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 font-display text-lg text-primary">
              <img src="/images/brand/uncrop-care-logo.png" alt="UN CROP CARE" className="h-8 w-8 rounded-full object-contain" />
              <span>UN CROP CARE · Staff Portal</span>
            </Link>
            {roles.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-semibold text-primary border">
                <Shield className="h-3 w-3 text-leaf" />
                {roles.map((r: any) => formatRoleLabel(r as StaffRole)).join(", ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {!isStaff ? (
          <div className="rounded-2xl border bg-card p-10 text-center max-w-xl mx-auto shadow-soft">
            <Shield className="mx-auto h-12 w-12 text-leaf opacity-80" />
            <h1 className="mt-4 text-2xl font-semibold text-primary">
              Waiting for Staff Authorization
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account (<strong>{user?.email}</strong>) is verified and signed in,
              but no staff role has been assigned to your profile yet.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Contact your system administrator or super_admin to grant access to the operational dashboards.
            </p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="enquiries">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
              <TabsTrigger value="dealers">Dealer applications</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="staff">Staff & RBAC</TabsTrigger>}
            </TabsList>
            <TabsContent value="enquiries">
              <Enquiries />
            </TabsContent>
            <TabsContent value="dealers">
              <Dealers />
            </TabsContent>
            <TabsContent value="messages">
              <Messages />
            </TabsContent>
            <TabsContent value="products">
              <ProductsAdmin />
            </TabsContent>
            {isSuperAdmin && (
              <TabsContent value="staff">
                <StaffManagement />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}

function StaffManagement() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("sales_executive");
  const [busy, setBusy] = useState(false);

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setBusy(true);
    try {
      const res = await assignStaffRoleFn({
        data: {
          targetEmail: email.trim().toLowerCase(),
          role,
        },
      });
      toast.success(res.message);
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign staff role");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-leaf" />
          <h2 className="text-xl font-semibold text-primary">Assign Staff Role</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant one of the 7 staff roles to an existing registered user.
        </p>

        <form onSubmit={handleAssignRole} className="mt-6 grid gap-4 sm:grid-cols-[2fr_1.5fr_auto]">
          <Input
            placeholder="Staff user's email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)} ({r})
              </option>
            ))}
          </select>
          <Button type="submit" disabled={busy} className="rounded-full">
            {busy ? "Assigning…" : "Grant Role"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="font-semibold text-primary text-base">Role Permissions Summary</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {STAFF_ROLES.map((r) => (
            <div key={r} className="rounded-xl border p-4 bg-soft space-y-1">
              <span className="font-bold text-primary block">{formatRoleLabel(r)}</span>
              <span className="font-mono text-muted-foreground block text-[11px]">{r}</span>
              <p className="text-muted-foreground text-[11px] pt-1">
                {r === "super_admin" && "Full administrative control, staff management, settings."}
                {r === "business_admin" && "Product, catalogue, enquiry and business oversight."}
                {r === "manager" && "Field operations, enquiry response and partner applications."}
                {r === "accountant" && "Financial audits, invoice reviews and reporting."}
                {r === "sales_executive" && "Customer quotation response and lead management."}
                {r === "inventory_manager" && "Product stock, batches, and pack configuration."}
                {r === "billing_staff" && "Invoice drafting and customer billing records."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Enquiries() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["adm-enq"],
    queryFn: async () => (await getAdminEnquiriesFn()) ?? [],
  });

  async function setStatus(id: string, status: string) {
    try {
      await updateEnquiryStatusFn({
        data: {
          id,
          status: status as any,
        },
      });
      qc.invalidateQueries({ queryKey: ["adm-enq"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update enquiry status");
    }
  }

  if (!data.length) return <Empty />;
  return (
    <div className="mt-6 space-y-3">
      {data.map((e) => {
        const items = (e.items as { name: string; quantity: string; pack: string }[]) ?? [];
        return (
          <div key={e.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-sm font-bold text-primary">{e.reference}</span>{" "}
                <span className="ml-2 font-semibold">{e.name}</span> ·{" "}
                <a href={`tel:${e.phone}`} className="text-primary">
                  {e.phone}
                </a>
              </div>
              <select
                value={e.status}
                onChange={(ev) => setStatus(e.id, ev.target.value)}
                className="rounded-full border bg-background px-3 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {fmt(e.created_at)} {e.location && `· ${e.location}`} {e.pin_code && `· ${e.pin_code}`}{" "}
              {e.email && `· ${e.email}`}
            </p>
            {items.length > 0 && (
              <ul className="mt-3 text-sm">
                {items.map((i, k) => (
                  <li key={k}>
                    • {i.name} — qty {i.quantity}
                    {i.pack && `, ${i.pack}`}
                  </li>
                ))}
              </ul>
            )}
            {e.message && <p className="mt-2 text-sm text-muted-foreground">“{e.message}”</p>}
          </div>
        );
      })}
    </div>
  );
}

function Dealers() {
  const { data = [] } = useQuery({
    queryKey: ["adm-dealer"],
    queryFn: async () => (await getAdminDealersFn()) ?? [],
  });
  if (!data.length) return <Empty />;
  return (
    <div className="mt-6 space-y-3">
      {data.map((d) => (
        <div key={d.id} className="rounded-2xl border bg-card p-5 text-sm">
          <p className="font-semibold">
            {d.business_name} <span className="font-normal text-muted-foreground">— {d.applicant_name}</span>
          </p>
          <p className="mt-1">
            <a href={`tel:${d.mobile}`} className="text-primary">
              {d.mobile}
            </a>{" "}
            · {d.city}, {d.state} {d.pin_code}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmt(d.created_at)} {d.business_type && `· ${d.business_type}`}{" "}
            {d.experience_years && `· ${d.experience_years} yrs`} {d.email && `· ${d.email}`}
          </p>
          {d.current_dealership && <p className="mt-2">Current: {d.current_dealership}</p>}
          {d.message && <p className="mt-2 text-muted-foreground">“{d.message}”</p>}
        </div>
      ))}
    </div>
  );
}

function Messages() {
  const { data = [] } = useQuery({
    queryKey: ["adm-msg"],
    queryFn: async () => (await getAdminContactMessagesFn()) ?? [],
  });
  if (!data.length) return <Empty />;
  return (
    <div className="mt-6 space-y-3">
      {data.map((m) => (
        <div key={m.id} className="rounded-2xl border bg-card p-5 text-sm">
          <p className="font-semibold">
            {m.name} ·{" "}
            <a href={`tel:${m.phone}`} className="text-primary">
              {m.phone}
            </a>{" "}
            {m.email && <span className="font-normal text-muted-foreground">· {m.email}</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmt(m.created_at)} {m.subject && `· ${m.subject}`}
          </p>
          <p className="mt-2">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["adm-prod"],
    queryFn: async () => (await getAdminProductsFn()) ?? [],
  });
  const [newName, setNewName] = useState("");

  async function save(id: string, patch: Record<string, unknown>) {
    try {
      await updateAdminProductFn({
        data: {
          id,
          patch: patch as any,
        },
      });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["adm-prod"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      await createAdminProductFn({
        data: {
          name,
          slug,
          sort_order: data.length + 1,
        },
      });
      setNewName("");
      qc.invalidateQueries({ queryKey: ["adm-prod"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    }
  }

  async function handleImageUpload(id: string, file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const upload = await uploadAssetFn({
          data: {
            fileBase64: base64,
            mimeType: file.type as any,
            originalName: file.name,
          },
        });
        await save(id, { image_url: upload.url });
        toast.success("Image uploaded and linked!");
      } catch (err: any) {
        toast.error(err.message || "Failed to upload image");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New product name (saved as hidden draft)"
          maxLength={120}
        />
        <Button onClick={add}>Add</Button>
      </div>
      {data.map((p) => (
        <div key={p.id} className="rounded-2xl border bg-card p-5">
          <form
            className="grid gap-3 md:grid-cols-[auto_1fr_1fr_2fr_1fr_1.5fr_auto_auto] md:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save(p.id, {
                name: f.get("name"),
                category: f.get("category"),
                short_description: f.get("short_description"),
                pack_sizes: f.get("pack_sizes"),
                image_url: f.get("image_url"),
              });
            }}
          >
            <div className="relative group h-12 w-12 rounded-xl bg-soft border p-1 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={p.image_url || "/images/brand/uncrop-care-logo.png"}
                alt={p.name}
                className="h-full w-full object-contain"
              />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" title="Upload new photo">
                <Upload className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(p.id, file);
                  }}
                />
              </label>
            </div>
            <Input name="name" defaultValue={p.name} maxLength={120} aria-label="Name" />
            <Input name="category" defaultValue={p.category} maxLength={60} aria-label="Category" />
            <Input
              name="short_description"
              defaultValue={p.short_description ?? ""}
              maxLength={300}
              aria-label="Short description"
              placeholder="Short description"
            />
            <Input
              name="pack_sizes"
              defaultValue={p.pack_sizes ?? ""}
              maxLength={120}
              aria-label="Pack sizes"
              placeholder="Pack sizes"
            />
            <Input
              name="image_url"
              defaultValue={p.image_url ?? ""}
              maxLength={255}
              aria-label="Image URL"
              placeholder="/images/products/..."
              className="text-xs font-mono"
            />
            <label className="flex items-center gap-2 text-xs shrink-0">
              <Switch
                checked={p.is_public && p.status === "published"}
                onCheckedChange={(v) => save(p.id, { is_public: v, status: v ? "published" : "draft" })}
              />
              Visible
            </label>
            <Button type="submit" size="sm" variant="outline">
              Save
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="mt-10 text-center text-muted-foreground">Nothing here yet.</p>;
}
