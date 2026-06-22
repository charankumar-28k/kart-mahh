import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Save, ShieldCheck } from "lucide-react";
import { ProfileSection, inputClass } from "../components/ProfileSection";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/profile/personal")({ component: PersonalPage });

function PersonalPage() {
  const { user, updateProfile } = useSupabaseStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });

  useEffect(() => {
    if (user) setForm({ name: user.name ?? "", phone: user.phone ?? "", location: user.location ?? "" });
  }, [user?.id]);

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

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <ProfileSection title="Personal Information" subtitle="Update your name, phone, and location.">
      <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Full name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
          <input disabled value={user.email} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Brooklyn, NY" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-95">
            <Save className="h-4 w-4" /> Save changes
          </button>
          {saved && <span className="text-xs font-semibold text-green-600 animate-fade-in">Saved ✓</span>}
        </div>
      </form>
    </ProfileSection>
  );
}