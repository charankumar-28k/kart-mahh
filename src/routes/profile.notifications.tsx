import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Mail, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { ProfileSection } from "../components/ProfileSection";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/profile/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { user } = useSupabaseStore();

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

  const n = { email: true, sms: false, promos: true };
  const toggle = (_k: keyof typeof n) => {};

  const items: { key: keyof typeof n; label: string; desc: string; icon: typeof Bell }[] = [
    { key: "email", label: "Email notifications", desc: "Order updates and account alerts via email", icon: Mail },
    { key: "sms", label: "SMS notifications", desc: "Delivery and shipping updates by text", icon: MessageSquare },
    { key: "promos", label: "Promotions & offers", desc: "Sales, discounts and personalized picks", icon: Sparkles },
  ];

  return (
    <ProfileSection title="Notification Preferences" subtitle="Choose how we keep you updated.">
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.key} style={{ animationDelay: `${i * 60}ms` }} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 animate-fade-up hover-lift">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl [background:var(--gradient-brand)] text-primary-foreground">
              <it.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
            <button
              onClick={() => toggle(it.key)}
              role="switch"
              aria-checked={n[it.key]}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${n[it.key] ? "[background:var(--gradient-brand)]" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-md transition-all ${n[it.key] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}