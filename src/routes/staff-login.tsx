import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Truck, Shield, Package, CheckCircle2, Users, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/staff-login")({ component: StaffLoginPage });

type StaffPortal = "delivery" | "admin";

const PORTALS = {
  delivery: {
    label: "Delivery Agent", icon: Truck, color: "from-amber-500 to-orange-500",
    placeholder: "delivery@company.com", title: "Delivery Portal",
    desc: "Manage & track your active deliveries",
    features: [{ icon: Truck, text: "Claim available orders" }, { icon: CheckCircle2, text: "Update delivery status" }, { icon: Package, text: "View delivery timeline" }],
  },
  admin: {
    label: "Administrator", icon: Shield, color: "from-rose-500 to-pink-600",
    placeholder: "admin@company.com", title: "Admin Portal",
    desc: "Full control over products, orders & users",
    features: [{ icon: Package, text: "Manage all products" }, { icon: TrendingUp, text: "Oversee all orders" }, { icon: Users, text: "Manage users & revenue" }],
  },
};

function StaffLoginPage() {
  const { signIn, user } = useSupabaseStore();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<StaffPortal>("delivery");
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const current = PORTALS[portal];

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") navigate({ to: "/admin" });
    else if (user.role === "delivery") navigate({ to: "/delivery" });
    else setError("This is the staff portal. Customers please use the Customer Login.");
  }, [user, navigate]);

  const changePortal = (p: StaffPortal) => { setPortal(p); setEmail(""); setPassword(""); setError(""); };

  const tryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-hero)] opacity-80" />
      <div className={`pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-gradient-to-br ${current.color} opacity-20 blur-3xl animate-blob`} />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-border opacity-30 blur-3xl animate-float-slow" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2">
        <div className="relative hidden lg:flex lg:flex-col lg:justify-center">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 w-fit">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold shadow-[var(--shadow-glow)]">C</span>
            <span className="text-xl font-extrabold">Classi<span className="gradient-text">Ads</span></span>
          </Link>
          <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${current.color} px-4 py-1.5 text-sm font-bold text-white mb-4 w-fit`}>
            <current.icon className="h-4 w-4" /> {current.title}
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {portal === "delivery" ? <><span>Delivery</span> <span className="gradient-text">Hub</span></> : <><span>Admin</span> <span className="gradient-text">Portal</span></>}
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">{current.desc}</p>
          <ul className="mt-6 space-y-3">
            {current.features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${current.color} text-white`}><f.icon className="h-4 w-4" /></span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-2xl border border-border bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">🔒 Restricted Access</p>
            <p className="text-sm text-muted-foreground">This portal is for authorized staff only.</p>
            <Link to="/login" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">← Customer Login</Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-scale-pop">
          <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${current.color} opacity-30 blur-2xl transition-all duration-500`} />
          <div className="relative rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-5 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold">C</span>
                <span className="text-lg font-extrabold">ClassiAds</span>
              </Link>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">Staff Only</span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Staff Portal</p>
              <div className="grid grid-cols-2 gap-2">
                {(["delivery", "admin"] as StaffPortal[]).map((p) => {
                  const pt = PORTALS[p]; const active = portal === p;
                  return (
                    <button key={p} type="button" onClick={() => changePortal(p)}
                      className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all ${active ? `border-transparent bg-gradient-to-r ${pt.color} text-white shadow-lg` : "border-border bg-secondary text-muted-foreground hover:bg-muted"}`}>
                      <pt.icon className="h-5 w-5 shrink-0" />
                      <div className="text-left">
                        <p className="font-bold text-xs">{pt.label}</p>
                        <p className={`text-[10px] ${active ? "text-white/70" : "text-muted-foreground"}`}>{p === "delivery" ? "Deliveries" : "Full access"}</p>
                      </div>
                      {active && <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-2 ring-card"><span className={`h-2 w-2 rounded-full bg-gradient-to-br ${pt.color}`} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${current.color} text-white`}><current.icon className="h-5 w-5" /></span>
              <div>
                <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>{current.label} Login</h1>
                <p className="text-xs text-muted-foreground">{current.desc}</p>
              </div>
            </div>
            <form onSubmit={tryLogin} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email address</label>
                <div className="group mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:shadow-[var(--shadow-soft)]">
                  <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={current.placeholder} required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <div className="group mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:shadow-[var(--shadow-soft)]">
                  <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="Password" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-primary transition-colors">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium animate-fade-up">{error}</p>}
              <button type="submit" disabled={loading}
                className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r ${current.color} px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100`}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Signing in…" : <><span>Sign in to {portal === "delivery" ? "Delivery Hub" : "Admin Portal"}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </span>
              </button>
              <div className="pt-2 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Not staff?{" "}<Link to="/login" className="font-semibold text-primary hover:underline">Customer Login →</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
