import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { FormSelect } from "../components/FormSelect";
import { ProfileSection, inputClass } from "../components/ProfileSection";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/profile/payment")({ component: PaymentPage });

function PaymentPage() {
  const { user, paymentMethods, addPayment, removePayment } = useSupabaseStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ brand: "Visa", number: "", holder: "", expiry: "" });

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = form.number.replace(/\D/g, "");
    if (digits.length < 4) return;
    await addPayment({ brand: form.brand, last4: digits.slice(-4), holder: form.holder, expiry: form.expiry });
    setForm({ brand: "Visa", number: "", holder: "", expiry: "" });
    setAdding(false);
  };

  return (
    <ProfileSection title="Payment Methods" subtitle="Add and manage your cards. (Demo — no real charges.)">
      <div className="space-y-3">
        {paymentMethods.map((p, i) => (
          <div key={p.id} style={{ animationDelay: `${i * 60}ms` }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 animate-fade-up hover-lift">
            <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold text-xs">
              {p.brand}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono font-bold">•••• •••• •••• {p.last4}</p>
              <p className="text-xs text-muted-foreground">{p.holder} · Exp {p.expiry}</p>
            </div>
            <button onClick={() => removePayment(p.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {paymentMethods.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card p-6 text-center">No payment methods saved yet.</p>
        )}
      </div>

      {adding ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-border bg-card p-5 space-y-3 animate-fade-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Card brand</label>
              <FormSelect
                value={form.brand}
                onValueChange={(brand) => setForm({ ...form, brand })}
                options={[
                  { value: "Visa", label: "Visa" },
                  { value: "Mastercard", label: "Mastercard" },
                  { value: "Amex", label: "Amex" },
                  { value: "Discover", label: "Discover" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Cardholder name</label>
              <input value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} className={inputClass} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Card number</label>
              <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputClass} placeholder="4242 4242 4242 4242" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Expiry</label>
              <input value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={inputClass} placeholder="MM/YY" required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform">Save card</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-5 inline-flex items-center gap-2 rounded-full [background:var(--gradient-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-transform">
          <Plus className="h-4 w-4" /> Add new card
        </button>
      )}
    </ProfileSection>
  );
}
