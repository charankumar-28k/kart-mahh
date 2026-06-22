import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Menu, LogIn, LogOut, Truck, Shield, ChevronDown, Search, X, Home, Grid3X3, Flame, Star, Sun, Moon, ShoppingCart, User as UserIcon, Bell, Package, UserPlus, Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSupabaseStore } from "../lib/supabase-store";
import { useCart, toggleTheme, getTheme } from "../lib/cart-store";
import * as api from "../lib/api";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user, notifications, signOut, markNotificationsRead } = useSupabaseStore();
  const cartItems = useCart();
  const cartCount = cartItems.reduce((t, c) => t + c.qty, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [theme, setTheme] = useState<"light" | "dark">(getTheme());

  const nav: { to: "/" | "/products"; search?: Record<string, string>; label: string; icon: typeof Home }[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/products", label: "Shop", icon: Grid3X3 },
    { to: "/products", search: { tab: "trending" }, label: "Trending", icon: Flame },
    { to: "/products", search: { tab: "best" }, label: "Best Sellers", icon: Star },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q: q.trim() || undefined, tab: "all" } as any });
    setOpen(false);
  };

  return (
    <>
    <header className="sticky top-0 z-50 glass animate-fade-in">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold shadow-[var(--shadow-glow)] transition-transform group-hover:scale-110 group-hover:rotate-6">
            C
          </span>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight">
            Classi<span className="gradient-text">Ads</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              search={n.search as any}
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:[background:var(--gradient-brand)] after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
            >
              {n.label}
            </Link>
          ))}
          {user?.role === "delivery" && (
            <Link to="/delivery" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> Delivery
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md items-center gap-2 rounded-full bg-muted px-3 py-1.5 ring-1 ring-transparent focus-within:ring-primary transition-all">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && <button type="button" onClick={() => setQ("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </form>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => { toggleTheme(); setTheme(getTheme()); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-all hover:scale-110 hover:bg-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); if (!notifOpen) markNotificationsRead(); }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-all hover:scale-110 hover:bg-secondary"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] animate-fade-up overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</p>
                    {unreadCount > 0 && <span className="text-[10px] font-semibold text-primary">{unreadCount} new</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications yet</p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifications.slice(0, 10).map((n: any) => (
                        <li key={n.id} className={`px-4 py-3 text-xs ${!n.read ? "bg-primary/5" : ""}`}>
                          <p className={`font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                          <p className="text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-all hover:scale-110 hover:bg-secondary"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full [background:var(--gradient-brand)] text-[10px] font-bold text-white shadow-sm">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 sm:px-3 py-2 text-xs font-semibold hover:bg-secondary transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full [background:var(--gradient-brand)] text-primary-foreground text-[10px] font-bold">
                  {user.name.charAt(0)}
                </span>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)] animate-fade-up z-50">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-1">
                    <p>Signed in as</p>
                    <p className="font-semibold text-foreground truncate">{user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {user.role}
                    </span>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                    <UserIcon className="h-3.5 w-3.5" /> My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                    <Package className="h-3.5 w-3.5" /> My Orders
                  </Link>

                  {user.role === "delivery" && (
                    <Link to="/delivery" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                      <Truck className="h-3.5 w-3.5" /> Delivery Portal
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <>
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                        <Shield className="h-3.5 w-3.5" /> Admin Portal
                      </Link>
                      <Link to="/post-ad" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                        <Plus className="h-3.5 w-3.5" /> Add Product
                      </Link>
                      <button onClick={() => { setMenuOpen(false); setShowCreateAgent(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                        <UserPlus className="h-3.5 w-3.5" /> Create Delivery Agent
                      </button>
                    </>
                  )}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); navigate({ to: "/" }); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-secondary"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
              >
                <LogIn className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/staff-login"
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Staff
              </Link>
            </div>
          )}

          {user?.role === "admin" && (
            <Link
              to="/post-ad"
              className="group relative hidden md:inline-flex items-center gap-1.5 overflow-hidden rounded-full [background:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Add Product</span>
              <span className="pointer-events-none absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="lg:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-3 lg:hidden animate-fade-up">
          <form onSubmit={submitSearch} className="mb-3 flex items-center gap-2 rounded-full bg-muted px-3 py-2 md:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none" />
          </form>
          {nav.map((n) => (
            <Link key={n.label} to={n.to} search={n.search as any} className="flex items-center gap-2 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
              <n.icon className="h-4 w-4 text-muted-foreground" /> {n.label}
            </Link>
          ))}
          <Link to="/cart" className="flex items-center gap-2 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full [background:var(--gradient-brand)] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user?.role === "admin" && (
            <>
              <Link to="/admin" className="flex items-center gap-2 py-2 text-sm font-medium text-primary" onClick={() => setOpen(false)}><Shield className="h-4 w-4" /> Admin Portal</Link>
              <Link to="/post-ad" className="flex items-center gap-2 py-2 text-sm font-medium text-primary" onClick={() => setOpen(false)}><Plus className="h-4 w-4" /> Add Product</Link>
            </>
          )}
          {user?.role === "delivery" && (
            <Link to="/delivery" className="flex items-center gap-2 py-2 text-sm font-medium text-primary" onClick={() => setOpen(false)}><Truck className="h-4 w-4" /> Delivery</Link>
          )}
          {!user && (
            <>
              <Link to="/login" className="flex items-center gap-2 py-2 text-sm font-medium" onClick={() => setOpen(false)}><LogIn className="h-4 w-4" /> Customer Login</Link>
              <Link to="/staff-login" className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}><LogIn className="h-4 w-4" /> Staff Login</Link>
            </>
          )}
          <button onClick={toggleTheme} className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      )}
    </header>
    {showCreateAgent && <CreateAgentModal onClose={() => setShowCreateAgent(false)} />}
    </>
  );
}

function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.createDeliveryAgent(form.name, form.email, form.password, form.phone);
      setSuccess(`Agent "${form.name}" created! They can now log in via Staff Login.`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create agent.");
    } finally {
      setLoading(false);
    }
  };

  const inp = "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-card transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] animate-scale-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white"><UserPlus className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold">Create Delivery Agent</h2>
              <p className="text-xs text-muted-foreground">Admin-issued credentials only</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 space-y-2">
            <p className="font-bold">✓ {success}</p>
            <button onClick={onClose} className="mt-2 rounded-xl [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Agent full name" className="flex-1 bg-transparent text-sm outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="agent@company.com" className="flex-1 bg-transparent text-sm outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" placeholder="+1 (555) 000-0000" className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Password *</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={show ? "text" : "password"} placeholder="Min. 6 chars" className="flex-1 bg-transparent text-sm outline-none" required />
                  <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-primary">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Confirm *</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} type={show ? "text" : "password"} placeholder="Repeat" className="flex-1 bg-transparent text-sm outline-none" required />
                </div>
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] transition-transform disabled:opacity-60">
                {loading ? "Creating…" : "Create Agent"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg [background:var(--gradient-brand)] text-primary-foreground font-bold text-xs">C</span>
              <span className="font-extrabold">Classi<span className="gradient-text">Ads</span></span>
            </div>
            <p className="text-xs text-muted-foreground">Buy & sell anything near you. The #1 local marketplace.</p>
          </div>
          <div>
            <p className="font-bold mb-2">Shop</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <Link to="/products" className="block hover:text-primary">All Products</Link>
              <Link to="/products" search={{ tab: "trending" } as any} className="block hover:text-primary">Trending</Link>
              <Link to="/products" search={{ tab: "best" } as any} className="block hover:text-primary">Best Sellers</Link>
            </div>
          </div>
          <div>
            <p className="font-bold mb-2">Account</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <Link to="/profile" className="block hover:text-primary">My Profile</Link>
              <Link to="/orders" className="block hover:text-primary">My Orders</Link>
              <Link to="/cart" className="block hover:text-primary">Cart</Link>
            </div>
          </div>
          <div>
            <p className="font-bold mb-2">Support</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <Link to="/login" className="block hover:text-primary">Sign In</Link>
              <Link to="/staff-login" className="block hover:text-primary">Staff Login</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 ClassiAds. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
