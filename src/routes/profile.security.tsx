import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ShieldCheck, Save } from "lucide-react";
import { ProfileSection, inputClass } from "../components/ProfileSection";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/profile/security")({ component: SecurityPage });

function SecurityPage() {
  const { user, changePassword } = useSupabaseStore();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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
    if (form.next.length < 6) return setMsg({ kind: "err", text: "Password must be at least 6 characters." });
    if (form.next !== form.confirm) return setMsg({ kind: "err", text: "Passwords don't match." });
    try {
      await changePassword(form.next);
      setForm({ current: "", next: "", confirm: "" });
      setMsg({ kind: "ok", text: "Password updated ✓" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err: any) {
      setMsg({ kind: "err", text: err?.message ?? "Failed to update password." });
    }
  };

  return (
    <ProfileSection title="Security Password" subtitle="Change your password and keep your account safe.">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Current password</label>
          <input type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={inputClass} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">New password</label>
            <input type="password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={inputClass} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Confirm new password</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass} required />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:scale-[1.02] transition-transform">
            <Save className="h-4 w-4" /> Update password
          </button>
          {msg && <span className={`text-xs font-semibold animate-fade-in ${msg.kind === "ok" ? "text-green-600" : "text-destructive"}`}>{msg.text}</span>}
        </div>
      </form>
    </ProfileSection>
  );
}