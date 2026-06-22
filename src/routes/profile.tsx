import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User as UserIcon, Mail, Phone, MapPin, Save, LogOut,
  ShieldAlert, Shield, Truck, Package, CheckCircle2,
  Lock, Bell, CreditCard, ChevronRight, Edit3, X, Check
} from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/profile")({ component: ProfileLayout });

function ProfileLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <ProfilePage />;
}

const inp = "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_oklch(0.55_0.24_268/0.1)] disabled:opacity-50 disabled:cursor-not-allowed";

function ProfilePage() {
  const { user, updateProfile, signOut } = useSupabaseStore();
  const ordersCount = 0;
  const deliveredCount = 0;

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", altPhone: "",
    houseNo: "", street: "", city: "", state: "", country: "", zip: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        altPhone: user.alt_phone ?? "",
        houseNo: user.house_no ?? "",
        street: user.street ?? "",
        city: user.city ?? "",
        state: user.state ?? "",
        country: user.country ?? "",
        zip: user.zip ?? "",
      });
    }
  }, [user?.id]);

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please log in to access your account details.</p>
          <Link to="/login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Go to login
          </Link>
        </div>
      </PageShell>
    );
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: form.name,
      phone: form.phone,
      alt_phone: form.altPhone,
      house_no: form.houseNo,
      street: form.street,
      city: form.city,
      state: form.state,
      country: form.country,
      zip: form.zip,
      address: [form.houseNo, form.street].filter(Boolean).join(", "),
      location: [form.city, form.state].filter(Boolean).join(", "),
    });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const cancel = () => {
    setEditing(false);
    if (user) {
      setForm({
        name: user.name ?? "", phone: user.phone ?? "", altPhone: user.alt_phone ?? "",
        houseNo: user.house_no ?? "", street: user.street ?? "", city: user.city ?? "",
        state: user.state ?? "", country: user.country ?? "", zip: user.zip ?? "",
      });
    }
  };

  const roleColor = user.role === "admin" ? "from-rose-500 to-pink-600"
    : user.role === "delivery" ? "from-amber-500 to-orange-500"
    : "from-sky-500 to-blue-600";

  const rolePortal = user.role === "admin"
    ? { to: "/admin" as const, label: "Admin Portal", icon: Shield, desc: "Manage products, orders & users", color: "from-rose-500 to-pink-600" }
    : user.role === "delivery"
    ? { to: "/delivery" as const, label: "Delivery Portal", icon: Truck, desc: "Manage your active deliveries", color: "from-amber-500 to-orange-500" }
    : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-5 py-10 space-y-6">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-3xl [background:var(--gradient-hero)] p-6 sm:p-8 animate-fade-up">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full [background:var(--gradient-brand)] opacity-20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br ${roleColor} text-3xl font-extrabold text-white shadow-lg`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${roleColor} px-3 py-1 text-[11px] font-bold uppercase text-white`}>
                {user.role === "admin" && <Shield className="h-3 w-3" />}
                {user.role === "delivery" && <Truck className="h-3 w-3" />}
                {user.role === "user" && <UserIcon className="h-3 w-3" />}
                {user.role}
              </span>
            </div>
            <div className="flex gap-3 text-center">
              <div className="rounded-2xl bg-card/80 px-4 py-3 backdrop-blur min-w-[64px]">
                <p className="text-xl font-extrabold gradient-text">{ordersCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Orders</p>
              </div>
              <div className="rounded-2xl bg-card/80 px-4 py-3 backdrop-blur min-w-[64px]">
                <p className="text-xl font-extrabold gradient-text">{deliveredCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Role-specific portal card ── */}
        {rolePortal && (
          <Link
            to={rolePortal.to}
            className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-r ${rolePortal.color} p-5 text-white shadow-lg hover:scale-[1.01] transition-transform animate-fade-up`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <rolePortal.icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-base">{rolePortal.label}</p>
              <p className="text-xs text-white/80">{rolePortal.desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        {/* ── Quick links for user role ── */}
        {user.role === "user" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
            {[
              { to: "/orders" as const, icon: Package, label: "My Orders", color: "text-amber-600 bg-amber-50" },
              { to: "/cart" as const, icon: CheckCircle2, label: "My Cart", color: "text-blue-600 bg-blue-50" },
              { to: "/profile/security" as const, icon: Lock, label: "Security", color: "text-rose-600 bg-rose-50" },
              { to: "/profile/notifications" as const, icon: Bell, label: "Notifications", color: "text-indigo-600 bg-indigo-50" },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center hover-lift transition-all">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Profile form ── */}
        <form onSubmit={save} className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 animate-fade-up">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>
                Profile <span className="gradient-text">Details</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your personal information and shipping address</p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 animate-fade-in">
                  <Check className="h-3 w-3" /> Saved!
                </span>
              )}
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors">
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
              ) : (
                <button type="button" onClick={cancel}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* ── Section 1: Personal Info ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <UserIcon className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Name <span className="text-destructive">*</span></label>
                <input value={form.name} onChange={f("name")} disabled={!editing} required className={inp} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <input value={user.email} disabled className={inp} />
                <p className="mt-1 text-[10px] text-muted-foreground">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Mobile Number <span className="text-destructive">*</span>
                </label>
                <input value={form.phone} onChange={f("phone")} disabled={!editing} type="tel" className={inp} placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Alternate Contact Number
                  <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">optional</span>
                </label>
                <input value={form.altPhone} onChange={f("altPhone")} disabled={!editing} type="tel" className={inp} placeholder="+1 (555) 987-6543" />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* ── Section 2: Shipping Address ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <MapPin className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Shipping Address</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">House / Flat Number</label>
                <input value={form.houseNo} onChange={f("houseNo")} disabled={!editing} className={inp} placeholder="Apt 4B, Block C" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Street</label>
                <input value={form.street} onChange={f("street")} disabled={!editing} className={inp} placeholder="742 Evergreen Terrace" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">City</label>
                <input value={form.city} onChange={f("city")} disabled={!editing} className={inp} placeholder="Brooklyn" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">State / Province</label>
                <input value={form.state} onChange={f("state")} disabled={!editing} className={inp} placeholder="New York" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Country</label>
                <input value={form.country} onChange={f("country")} disabled={!editing} className={inp} placeholder="United States" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">ZIP / PIN Code</label>
                <input value={form.zip} onChange={f("zip")} disabled={!editing} className={inp} placeholder="11201" />
              </div>
            </div>

            {/* Address preview */}
            {!editing && (form.houseNo || form.street || form.city) && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary px-4 py-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  {[form.houseNo, form.street, form.city, form.state, form.country, form.zip].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* ── Save button ── */}
          {editing && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button type="submit"
                className="inline-flex items-center gap-2 rounded-xl [background:var(--gradient-brand)] px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-95">
                <Save className="h-4 w-4" /> Save changes
              </button>
              <button type="button" onClick={cancel}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
                Cancel
              </button>
            </div>
          )}
        </form>

        {/* ── Account settings links ── */}
        <div className="grid gap-3 sm:grid-cols-2 animate-fade-up">
          {[
            { to: "/profile/security" as const, icon: Lock, label: "Security & Password", desc: "Change your password", color: "from-rose-500 to-pink-600" },
            { to: "/profile/notifications" as const, icon: Bell, label: "Notifications", desc: "Email, SMS & promo preferences", color: "from-indigo-500 to-blue-700" },
            { to: "/profile/payment" as const, icon: CreditCard, label: "Payment Methods", desc: "Saved cards & wallets", color: "from-violet-500 to-purple-600" },
            { to: "/orders" as const, icon: Package, label: "Order History", desc: "Track and review purchases", color: "from-amber-500 to-orange-600" },
          ].map((s) => (
            <Link key={s.to} to={s.to}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover-lift transition-all">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                <s.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={() => { signOut(); window.location.href = "/"; }}
          className="group flex w-full items-center gap-4 rounded-2xl border border-destructive/30 bg-card p-4 hover:bg-destructive/5 transition-colors animate-fade-up"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold text-sm text-destructive">Sign out</p>
            <p className="text-xs text-muted-foreground">End your current session</p>
          </div>
        </button>

      </div>
    </PageShell>
  );
}
