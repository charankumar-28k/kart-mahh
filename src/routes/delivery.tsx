import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Truck, Package, Check, MapPin, ShieldAlert, Hand,
  Phone, User as UserIcon, Clock, ChevronDown, ChevronUp,
  CheckCircle2, Navigation, AlertCircle, Loader2,
} from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store.tsx";
import { ORDER_STAGES, ORDER_LABEL, type OrderStatus } from "../lib/store";

export const Route = createFileRoute("/delivery")({ component: DeliveryPage });

function DeliveryPage() {
  const { user, orders, availableOrders, loading, advanceOrder, claimOrder } = useSupabaseStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "available" | "done">("active");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading delivery portal...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!user || user.role !== "delivery") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Delivery agents only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with a delivery account to access this portal.</p>
          <Link to="/staff-login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Staff Login
          </Link>
        </div>
      </PageShell>
    );
  }

  // Active = assigned to me, not done/cancelled
  const mine = orders.filter((o: any) =>
    o.assigned_to === user.id && o.status !== "delivered" && o.status !== "cancelled"
  );
  // Done = assigned to me, delivered
  const done = orders.filter((o: any) => o.assigned_to === user.id && o.status === "delivered");

  const nextStatus = (s: OrderStatus): OrderStatus | null => {
    const i = ORDER_STAGES.indexOf(s);
    return i >= 0 && i < ORDER_STAGES.length - 1 ? ORDER_STAGES[i + 1] : null;
  };

  const statusColor = (s: OrderStatus) => {
    if (s === "delivered") return "bg-emerald-100 text-emerald-700";
    if (s === "out_for_delivery") return "bg-blue-100 text-blue-700";
    if (s === "shipped") return "bg-violet-100 text-violet-700";
    if (s === "packed") return "bg-amber-100 text-amber-700";
    return "bg-secondary text-muted-foreground";
  };

  const handleClaim = async (orderId: string) => {
    setClaiming(orderId);
    try {
      await claimOrder(orderId);
      setTab("active");
    } finally {
      setClaiming(null);
    }
  };

  const handleAdvance = async (orderId: string, status: OrderStatus) => {
    setAdvancing(orderId);
    try {
      await advanceOrder(orderId, status, user.id);
    } finally {
      setAdvancing(null);
    }
  };

  const TABS = [
    { id: "active" as const, label: "My Deliveries", count: mine.length, icon: Truck },
    { id: "available" as const, label: "Available", count: availableOrders.length, icon: Hand },
    { id: "done" as const, label: "Completed", count: done.length, icon: CheckCircle2 },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-5 py-10 space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 sm:p-8 text-white animate-fade-up">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Truck className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>
                Delivery Portal
              </h1>
              <p className="text-sm text-white/80">Welcome back, {user.name}</p>
            </div>
            <Link to="/delivery-profile"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-colors backdrop-blur">
              <UserIcon className="h-4 w-4" /> My Profile
            </Link>
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Active", value: mine.length, icon: Navigation },
              { label: "Available", value: availableOrders.length, icon: Package },
              { label: "Completed", value: done.length, icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 backdrop-blur p-3 text-center">
                <s.icon className="mx-auto h-4 w-4 mb-1" />
                <p className="text-xl font-extrabold">{s.value}</p>
                <p className="text-[11px] text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${tab === t.id ? "[background:var(--gradient-brand)] text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.id ? "bg-white/20" : "bg-border"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── My Active Deliveries ── */}
        {tab === "active" && (
          <div className="space-y-3">
            {mine.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center animate-fade-up">
                <Truck className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-semibold">No active deliveries</p>
                <p className="text-sm text-muted-foreground mt-1">Claim an available order to get started.</p>
                <button onClick={() => setTab("available")} className="mt-4 text-sm font-semibold text-primary hover:underline">
                  View available orders →
                </button>
              </div>
            ) : (
              mine.map((o: any, idx: number) => {
                const next = nextStatus(o.status);
                const stageIdx = ORDER_STAGES.indexOf(o.status);
                const isOpen = openId === o.id;
                const isAdvancing = advancing === o.id;
                return (
                  <div key={o.id} style={{ animationDelay: `${idx * 50}ms` }} className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-up">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                          <p className="font-bold">
                            {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                            <span className="gradient-text">${Number(o.total).toFixed(2)}</span>
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(o.status)}`}>
                          {ORDER_LABEL[o.status as OrderStatus]}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="mt-3 rounded-xl bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <UserIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-semibold text-foreground">{o.address_name}</span>
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                          {o.address_phone}
                        </p>
                        <p className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                          {o.address_line1}, {o.address_city} {o.address_zip}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 flex gap-1">
                        {ORDER_STAGES.map((stage, i) => {
                          const active = stageIdx >= i;
                          return (
                            <div key={stage} className="flex-1 space-y-1">
                              <div className={`h-1.5 rounded-full transition-all ${active ? "[background:var(--gradient-brand)]" : "bg-border"}`} />
                              <p className="text-[9px] text-muted-foreground text-center hidden sm:block leading-tight">{ORDER_LABEL[stage]}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {next && (
                          <button
                            onClick={() => handleAdvance(o.id, next)}
                            disabled={isAdvancing}
                            className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-primary-foreground hover:scale-105 active:scale-95 transition-transform disabled:opacity-60">
                            {isAdvancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Mark: {ORDER_LABEL[next]}
                          </button>
                        )}
                        <button onClick={() => setOpenId(isOpen ? null : o.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors">
                          <Clock className="h-3 w-3" /> Timeline
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    {isOpen && (
                      <div className="border-t border-border bg-secondary/40 px-5 py-4 animate-fade-up">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Status History</p>
                        <ol className="space-y-3 border-l-2 border-dashed border-border pl-5">
                          {(o.order_history ?? []).slice().reverse().map((h: any, hi: number) => (
                            <li key={hi} className="relative">
                              <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full [background:var(--gradient-brand)] text-white ring-2 ring-background">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                              <p className="text-xs font-bold">{ORDER_LABEL[h.status as OrderStatus] ?? h.status}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(h.at).toLocaleString()}</p>
                              {h.note && <p className="text-[10px] text-muted-foreground italic">"{h.note}"</p>}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Available to claim ── */}
        {tab === "available" && (
          <div className="space-y-3">
            {availableOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center animate-fade-up">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-semibold">No orders available</p>
                <p className="text-sm text-muted-foreground mt-1">All current orders have been claimed.</p>
              </div>
            ) : (
              availableOrders.map((o: any, idx: number) => (
                <div key={o.id} style={{ animationDelay: `${idx * 50}ms` }}
                  className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 p-5 animate-fade-up hover-lift">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                      <p className="font-bold">
                        {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                        <span className="gradient-text">${Number(o.total).toFixed(2)}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                        {o.address_line1}, {o.address_city} {o.address_zip}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClaim(o.id)}
                      disabled={claiming === o.id}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-60">
                      {claiming === o.id
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Claiming…</>
                        : <><Hand className="h-4 w-4" /> Claim & Pack</>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Completed deliveries ── */}
        {tab === "done" && (
          <div className="space-y-2">
            {done.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center animate-fade-up">
                <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-semibold">No completed deliveries yet</p>
              </div>
            ) : (
              done.slice().reverse().map((o: any, idx: number) => (
                <div key={o.id} style={{ animationDelay: `${idx * 40}ms` }}
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 px-4 py-3 animate-fade-up hover-lift">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                    <p className="text-sm font-semibold truncate">{o.address_name} · {o.address_city}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold gradient-text">${Number(o.total).toFixed(2)}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="h-3 w-3" /> Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </PageShell>
  );
}
