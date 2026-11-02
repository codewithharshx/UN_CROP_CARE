import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function Field({ label, name, error, children, required }: { label: string; name: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function zodErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}
