import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Shield, Plus, Edit3, Trash2, Package, ShieldAlert, X,
  DollarSign, TrendingUp, CheckCircle2, Truck, Users,
  ChevronDown, ChevronUp, Search, Mail, Phone, Lock, Eye, EyeOff, UserPlus, KeyRound
} from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { CATEGORIES } from "../lib/categories";
import { useSupabaseStore } from "../lib/supabase-store.tsx";
import * as api from "../lib/api";
import { ORDER_LABEL, ORDER_STAGES, type OrderStatus, type Product } from "../lib/store";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const inp = "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-card transition-all";

function emptyProduct(sellerId: string): Product {
  return {
    id: crypto.randomUUID(), title: "", price: 0,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    category: "fashion", subcategory: "mens", rating: 4.5,
    description: "", tags: [], stock: 10, location: "Brooklyn, NY", sellerId,
  };
}

type Tab = "products" | "orders" | "users" | "agents";

function AdminPage() {
  const { user, products, orders, loading, upsertProduct: storeUpsert, deleteProduct: storeDelete, advanceOrder: storeAdvance } = useSupabaseStore();
  const users = useMemo(() => [] as any[], []);

  const [tab, setTab] = useState<Tab>("products");
  const [editing, setEditing] = useState<Product | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [resetAgentId, setResetAgentId] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "admin") {
      api.getDeliveryAgents().then(setAgents).catch(() => {});
    }
  }, [user?.role]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading admin portal...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">You need admin access to view this page.</p>
          <Link to="/login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Login as admin
          </Link>
        </div>
      </PageShell>
    );
  }

  const revenue = useMemo(() => orders.filter((o: any) => o.status !== "cancelled").reduce((t: number, o: any) => t + Number(o.total), 0), [orders]);
  const activeOrders = useMemo(() => orders.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length, [orders]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const t = productSearch.toLowerCase();
    return products.filter((p: any) => p.title.toLowerCase().includes(t) || p.category.toLowerCase().includes(t));
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const t = orderSearch.toLowerCase();
    return orders.filter((o: any) => o.id.toLowerCase().includes(t) || o.address_name?.toLowerCase().includes(t));
  }, [orders, orderSearch]);

  const nextStatus = (s: OrderStatus): OrderStatus | null => {
    const i = ORDER_STAGES.indexOf(s);
    return i >= 0 && i < ORDER_STAGES.length - 1 ? ORDER_STAGES[i + 1] : null;
  };

  const TABS: { id: Tab; label: string; count: number; icon: typeof Shield }[] = [
    { id: "products", label: "Products", count: products.length, icon: Package },
    { id: "orders", label: "Orders", count: orders.length, icon: TrendingUp },
    { id: "agents", label: "Delivery Agents", count: agents.length, icon: Truck },
    { id: "users", label: "Users", count: users.filter((u: any) => u.role === "user").length, icon: Users },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-5 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl [background:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <Shield className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                Admin <span className="gradient-text">Portal</span>
              </h1>
              <p className="text-xs text-muted-foreground">Manage products, orders & users</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 animate-fade-up">
          {[
            { label: "Products", value: products.length, icon: Package, bg: "from-sky-500 to-blue-600" },
            { label: "Total Orders", value: orders.length, icon: TrendingUp, bg: "from-violet-500 to-purple-600" },
            { label: "Active Orders", value: activeOrders, icon: CheckCircle2, bg: "from-emerald-500 to-teal-600" },
            { label: "Revenue", value: `$${revenue.toFixed(0)}`, icon: DollarSign, bg: "from-amber-500 to-orange-500" },
          ].map((s, i) => (
            <div key={s.label} style={{ animationDelay: `${i * 70}ms` }} className="rounded-2xl border border-border bg-card p-5 animate-fade-up hover-lift">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.bg} text-white`}>
                <s.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === t.id ? "[background:var(--gradient-brand)] text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-border"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {tab === "products" && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 max-w-sm flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..." className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <button onClick={() => setEditing(emptyProduct(user.id))}
                className="ml-3 inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-semibold text-lg">No products yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first product to get started.</p>
                <button onClick={() => setEditing(emptyProduct(user.id))}
                  className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4" /> Add First Product
                </button>
              </div>
            ) : (
              <>
                {/* Grid view */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((p: any, i: number) => (
                    <div key={p.id} style={{ animationDelay: `${i * 30}ms` }}
                      className="group relative rounded-2xl border border-border bg-card overflow-hidden animate-fade-up hover-lift">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img src={p.image} alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        {p.stock === 0 && (
                          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">Out of stock</span>
                        )}
                        {p.stock > 0 && p.stock < 5 && (
                          <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">Low stock</span>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditing(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow hover:bg-white transition-colors">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { if (confirm(`Delete "${p.title}"?`)) storeDelete(p.id); }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-destructive shadow hover:bg-white transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{p.category} / {p.subcategory}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-extrabold gradient-text">${Number(p.price).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">Stock: <span className={`font-semibold ${p.stock === 0 ? "text-destructive" : p.stock < 5 ? "text-amber-500" : "text-foreground"}`}>{p.stock}</span></span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-xs text-[var(--accent-orange)] font-semibold">★ {p.rating}</span>
                          {p.tags?.length > 0 && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p.tags[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table view below grid */}
                <div className="overflow-x-auto rounded-2xl border border-border bg-card mt-4">
                  <table className="min-w-full text-sm">
                    <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Stock</th>
                        <th className="px-4 py-3 text-right">Rating</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p: any, i: number) => (
                        <tr key={p.id} style={{ animationDelay: `${i * 25}ms` }}
                          className="border-t border-border hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                              <span className="font-semibold truncate max-w-[180px]">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize text-muted-foreground text-xs">{p.category} / {p.subcategory}</td>
                          <td className="px-4 py-3 text-right font-bold">${Number(p.price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${p.stock === 0 ? "text-destructive" : p.stock < 5 ? "text-amber-500" : ""}`}>{p.stock}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--accent-orange)]">★ {p.rating}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditing(p)} className="rounded-lg p-2 hover:bg-primary/10 text-primary transition-colors" title="Edit">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => { if (confirm(`Delete "${p.title}"?`)) storeDelete(p.id); }} className="rounded-lg p-2 hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order ID or name..." className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            {filteredOrders.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No orders found.</p>
            )}
            {filteredOrders.map((o) => {
              const isOpen = expandedOrder === o.id;
              const next = o.status !== "cancelled" ? nextStatus(o.status) : null;
              const statusCls = o.status === "delivered" ? "bg-emerald-100 text-emerald-700"
                : o.status === "cancelled" ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary";
              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedOrder(isOpen ? null : o.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{o.id}</span>
                      <span className="truncate text-sm font-semibold">{(o as any).address_name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{(o as any).address_city}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusCls}`}>{ORDER_LABEL[o.status as OrderStatus]}</span>
                      <span className="font-bold text-sm">${Number(o.total).toFixed(2)}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-up">
                      <div className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Items</p>
                          <div className="space-y-2">
                          {(o as any).order_items?.map((it: any) => (
                              <div key={it.productId} className="flex items-center gap-2">
                                <img src={it.image} alt={it.title} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                                <span className="truncate flex-1 text-xs">{it.title}</span>
                                <span className="text-xs text-muted-foreground shrink-0">×{it.qty}</span>
                                <span className="text-xs font-bold shrink-0">${(Number(it.price) * it.qty).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-secondary p-3 text-xs space-y-1.5">
                          <p className="font-bold text-muted-foreground">Delivery details</p>
                          <p className="font-semibold">{(o as any).address_name} · {(o as any).address_phone}</p>
                          <p className="text-muted-foreground">{(o as any).address_line1}, {(o as any).address_city} {(o as any).address_zip}</p>
                          <p className="text-muted-foreground mt-1">Payment: <span className="font-semibold text-foreground capitalize">{o.payment}</span></p>
                          <p className="text-muted-foreground">Placed: <span className="text-foreground">{new Date(o.created_at).toLocaleString()}</span></p>
                          {(o as any).assigned_to && (
                            <p className="text-primary font-semibold flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Assigned to delivery agent
                            </p>
                          )}
                        </div>
                      </div>
                      {o.status !== "cancelled" && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {next && (
                            <button onClick={() => storeAdvance(o.id, next!, (o as any).assigned_to)}
                              className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-primary-foreground hover:scale-105 transition-transform">
                              Advance → {ORDER_LABEL[next]}
                            </button>
                          )}
                          {(o.status === "placed" || o.status === "packed") && (
                            <button
                              onClick={() => {
                                if (confirm("Cancel this order?")) {
                                  // Use advanceOrder with cancelled status to properly restore stock
                                  storeAdvance(o.id, "cancelled" as OrderStatus, (o as any).assigned_to, "Cancelled by admin");
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="h-3 w-3" /> Cancel order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Delivery Agents Tab ── */}
        {tab === "agents" && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{agents.length} delivery agent{agents.length !== 1 ? "s" : ""}</p>
              <button onClick={() => setShowCreateAgent(true)}
                className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
                <UserPlus className="h-4 w-4" /> Add Agent
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <Truck className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-semibold">No delivery agents yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create agent IDs to assign deliveries.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Agent</th>
                      <th className="px-4 py-3 text-left">Email / ID</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-right">Deliveries</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a, i) => {
                      const deliveries = orders.filter((o: any) => o.assigned_to === a.id).length;
                      return (
                        <tr key={a.id} style={{ animationDelay: `${i * 30}ms` }} className="border-t border-border hover:bg-secondary/50 transition-colors animate-fade-up">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-bold">
                                {a.name.charAt(0)}
                              </span>
                              <span className="font-semibold">{a.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{a.id}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.phone ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-bold">{deliveries}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setResetAgentId(a.id)}
                                className="rounded-lg p-2 hover:bg-amber-100 text-amber-600 transition-colors" title="Reset password">
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => { if (confirm(`Delete agent "${a.name}"?`)) api.deleteDeliveryAgent(a.id).then(() => api.getDeliveryAgents().then(setAgents)); }}
                                className="rounded-lg p-2 hover:bg-destructive/10 text-destructive transition-colors" title="Delete agent">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === "users" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card animate-fade-up">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((u: any) => u.role === "user").map((u: any, i: number) => {
                  const count = orders.filter((o: any) => o.user_id === u.id).length;
                  return (
                    <tr key={u.id} style={{ animationDelay: `${i * 30}ms` }} className="border-t border-border hover:bg-secondary/50 transition-colors animate-fade-up">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full [background:var(--gradient-brand)] text-primary-foreground text-sm font-bold">{u.name.charAt(0)}</span>
                          <span className="font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.location ?? u.city ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-bold">{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <ProductDialog product={editing} onClose={() => setEditing(null)} onSave={(p) => { storeUpsert({ ...p, seller_id: p.sellerId ?? user.id, old_price: p.oldPrice }); setEditing(null); }} />}
      {showCreateAgent && <CreateAgentDialog onClose={() => setShowCreateAgent(false)} />}
      {resetAgentId && <ResetPasswordDialog agentId={resetAgentId} onClose={() => setResetAgentId(null)} />}
    </PageShell>
  );
}

function CreateAgentDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
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
            <p className="text-xs text-emerald-600">Share these credentials with the agent. They can change their name, phone and password after logging in.</p>
            <button onClick={onClose} className="mt-2 rounded-xl [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white hover:scale-105 transition-transform">Done</button>
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
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] transition-transform disabled:opacity-60">{loading ? "Creating…" : "Create Agent"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetPasswordDialog({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const [agentName, setAgentName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProfile(agentId).then((p) => setAgentName(p.name)).catch(() => {});
  }, [agentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.changePassword(password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] animate-scale-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white"><KeyRound className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold">Reset Password</h2>
              <p className="text-xs text-muted-foreground">{agentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            <p className="font-bold">✓ Password reset successfully!</p>
            <p className="mt-1 text-xs">Share the new password with the agent.</p>
            <button onClick={onClose} className="mt-3 rounded-xl [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">New Password *</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="Min. 6 characters" className="flex-1 bg-transparent text-sm outline-none" required />
                <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-primary">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Confirm Password *</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-all">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? "text" : "password"} placeholder="Repeat" className="flex-1 bg-transparent text-sm outline-none" required />
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] transition-transform disabled:opacity-60">{loading ? "Resetting…" : "Reset Password"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProductDialog({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const [p, setP] = useState(product);
  const cat = CATEGORIES.find((c) => c.slug === p.category) ?? CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] animate-scale-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{product.title ? "Edit product" : "New product"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title</label>
            <input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} className={inp} placeholder="Product name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Price ($)</label>
              <input type="number" min="0" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Original price ($)</label>
              <input type="number" min="0" value={p.oldPrice ?? ""} onChange={(e) => setP({ ...p, oldPrice: e.target.value ? Number(e.target.value) : undefined })} className={inp} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Category</label>
              <select value={p.category} onChange={(e) => {
                const cat = CATEGORIES.find((c) => c.slug === e.target.value)!;
                setP({ ...p, category: e.target.value, subcategory: cat.subs[0].slug });
              }} className={inp}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Subcategory</label>
              <select value={p.subcategory} onChange={(e) => setP({ ...p, subcategory: e.target.value })} className={inp}>
                {cat.subs.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Stock</label>
              <input type="number" min="0" value={p.stock} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Rating (0–5)</label>
              <input type="number" step="0.1" min="0" max="5" value={p.rating} onChange={(e) => setP({ ...p, rating: Number(e.target.value) })} className={inp} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Location</label>
            <input value={p.location} onChange={(e) => setP({ ...p, location: e.target.value })} className={inp} placeholder="Brooklyn, NY" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Image URL</label>
            <input value={p.image} onChange={(e) => setP({ ...p, image: e.target.value })} className={inp} />
            {p.image && <img src={p.image} alt="" className="mt-2 h-16 w-16 rounded-xl object-cover border border-border" />}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea rows={3} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} className={inp + " resize-none"} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Tags</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(["top", "trending", "best", "near"] as const).map((t) => {
                const on = p.tags.includes(t);
                return (
                  <button key={t} type="button"
                    onClick={() => setP({ ...p, tags: on ? p.tags.filter((x) => x !== t) : [...p.tags, t] })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${on ? "[background:var(--gradient-brand)] text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => onSave(p)} disabled={!p.title.trim()}
            className="flex-1 rounded-xl [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
            Save product
          </button>
        </div>
      </div>
    </div>
  );
}
