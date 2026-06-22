import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, MapPin, ShieldCheck, Edit3, Check, AlertCircle } from "lucide-react";
import { ProfileSection, inputClass } from "../components/ProfileSection";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { z } from "zod";

export const Route = createFileRoute("/profile/address")({ component: AddressPage });

const addrSchema = z.object({
  label: z.string().min(1, "Label required"),
  name: z.string().min(2, "Name required"),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone"),
  line1: z.string().min(5, "Street address too short"),
  city: z.string().min(2, "City required"),
  zip: z.string().regex(/^[A-Za-z0-9\s\-]{3,10}$/, "Invalid ZIP/postal code"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof addrSchema>, string>>;
type FormState = { label: string; name: string; phone: string; line1: string; city: string; zip: string };
const BLANK: FormState = { label: "Home", name: "", phone: "", line1: "", city: "", zip: "" };

function AddressPage() {
  const { user, savedAddresses: addresses, addAddress, removeAddress } = useSupabaseStore();
  type SavedAddress = typeof addresses[number];

  const [mode, setMode] = useState<"idle" | "add" | "edit">("idle");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-xl font-bold">Sign in required</h1>
          <Link to="/login" className="mt-4 inline-block rounded-full [background:var(--gradient-brand)] px-5 py-2 text-sm font-semibold text-primary-foreground">Login</Link>
        </div>
      </PageShell>
    );
  }

  const validate = (): boolean => {
    const result = addrSchema.safeParse(form);
    if (result.success) { setErrors({}); return true; }
    const e: FormErrors = {};
    result.error.errors.forEach((err) => { if (err.path[0]) e[err.path[0] as keyof FormErrors] = err.message; });
    setErrors(e);
    return false;
  };

  const openAdd = () => { setForm(BLANK); setErrors({}); setEditId(null); setMode("add"); };
  const openEdit = (a: SavedAddress) => {
    setForm({ label: a.label, name: a.name, phone: a.phone, line1: a.line1, city: a.city, zip: a.zip });
    setErrors({});
    setEditId(a.id);
    setMode("edit");
  };
  const cancel = () => { setMode("idle"); setEditId(null); setErrors({}); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (mode === "edit" && editId) {
      await removeAddress(editId);
      await addAddress(form);
    } else {
      await addAddress(form);
    }
    cancel();
  };

  const setDefault = (_id: string) => {}; // order not relevant in Supabase

  const Field = ({ fkey, label, ph }: { fkey: keyof FormState; label: string; ph: string }) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={form[fkey]}
        onChange={(e) => setForm({ ...form, [fkey]: e.target.value })}
        placeholder={ph}
        className={`${inputClass} ${errors[fkey] ? "border-destructive" : ""}`}
      />
      {errors[fkey] && (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {errors[fkey]}
        </p>
      )}
    </div>
  );

  return (
    <ProfileSection title="Saved Addresses" subtitle="Manage your shipping locations.">
      <div className="space-y-3">
        {addresses.map((a, i) => (
          <div
            key={a.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`flex items-start gap-3 rounded-2xl border bg-card p-4 animate-fade-up hover-lift ${i === 0 ? "border-primary/40" : "border-border"}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl [background:var(--gradient-brand)] text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">{a.label}</span>
                {i === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Default</span>
                )}
              </div>
              <p className="mt-0.5 font-semibold text-sm">{a.name} · {a.phone}</p>
              <p className="text-xs text-muted-foreground">{a.line1}, {a.city} {a.zip}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {i !== 0 && (
                <button
                  onClick={() => setDefault(a.id)}
                  title="Set as default"
                  className="rounded-lg p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => openEdit(a)}
                className="rounded-lg p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeAddress(a.id)}
                className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && mode === "idle" && (
          <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            No saved addresses yet.
          </p>
        )}
      </div>

      {(mode === "add" || mode === "edit") && (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-border bg-card p-5 space-y-3 animate-fade-up">
          <h3 className="text-sm font-bold">{mode === "edit" ? "Edit address" : "Add new address"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field fkey="label" label="Label" ph="Home / Work / Other" />
            <Field fkey="name" label="Full name" ph="Jane Doe" />
            <Field fkey="phone" label="Phone" ph="+1 555 123 4567" />
            <Field fkey="zip" label="ZIP / Postal code" ph="11201" />
            <div className="sm:col-span-2">
              <Field fkey="line1" label="Street address" ph="123 Main St, Apt 4B" />
            </div>
            <div className="sm:col-span-2">
              <Field fkey="city" label="City" ph="Brooklyn" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform"
            >
              {mode === "edit" ? "Update address" : "Save address"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "idle" && (
        <button
          onClick={openAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-full [background:var(--gradient-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4" /> Add new address
        </button>
      )}
    </ProfileSection>
  );
}
