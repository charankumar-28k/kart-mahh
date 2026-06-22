import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Check, Truck, MapPin, Clock, ShieldCheck, ChevronDown, History, X, Loader2 } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { ORDER_STAGES, ORDER_LABEL } from "../lib/store";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, orders, cancelOrder } = useSupabaseStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async (orderId: string) => {
    if (!confirm("Cancel this order?")) return;
    setCancellingId(orderId);
    setCancelError(null);
    try {
      await cancelOrder(orderId);
    } catch (err: any) {
      setCancelError(err?.message ?? "Failed to cancel order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center animate-fade-up">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Sign in to view orders</h1>
          <Link to="/login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">Go to login</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight animate-fade-up" style={{ fontFamily: "'Sora', sans-serif" }}>
          My <span className="gradient-text">Orders</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length} orders</p>

        {orders.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-16 text-center animate-fade-up">
            <Package className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">No orders yet</h2>
            <Link to="/" className="mt-4 inline-block text-primary hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((o: any, idx: number) => {
              const isCancelled = o.status === "cancelled";
              const stageIdx = isCancelled ? -1 : ORDER_STAGES.indexOf(o.status);
              return (
                <div key={o.id} style={{ animationDelay: `${idx * 80}ms` }}
                  className={`rounded-2xl border bg-card p-6 animate-fade-up hover-lift ${isCancelled ? "border-destructive/30 opacity-75" : "border-border"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-bold">{o.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-2xl font-extrabold gradient-text">${Number(o.total).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{o.payment}</p>
                      {isCancelled && <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">Cancelled</span>}
                      <Link to="/orders/$orderId" params={{ orderId: o.id }} className="mt-1 inline-block text-[10px] font-semibold text-primary hover:underline">Track →</Link>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div className="mt-6 flex items-center">
                      {ORDER_STAGES.map((stage, i) => {
                        const active = i <= stageIdx;
                        const isCurrent = i === stageIdx;
                        return (
                          <div key={stage} className="flex-1 flex flex-col items-center relative">
                            {i > 0 && <div className={`absolute top-4 right-1/2 h-0.5 w-full transition-colors ${i <= stageIdx ? "bg-primary" : "bg-border"}`} />}
                            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all ${active ? "[background:var(--gradient-brand)] text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "scale-125 animate-pulse-ring" : ""}`}>
                              {active ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <span className={`mt-2 text-[10px] font-semibold text-center ${active ? "text-foreground" : "text-muted-foreground"}`}>{ORDER_LABEL[stage]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-[1fr_240px]">
                    <div className="space-y-2">
                      {(o.order_items ?? []).map((i: any) => (
                        <div key={i.id} className="flex items-center gap-3 text-sm">
                          <img src={i.image} alt={i.title} className="h-12 w-12 rounded-lg object-cover" />
                          <span className="flex-1 truncate font-medium">{i.title}</span>
                          <span className="text-muted-foreground">× {i.qty}</span>
                          <span className="font-bold w-16 text-right">${(i.price * i.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-secondary p-3 text-xs">
                      <p className="font-bold flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivering to</p>
                      <p className="mt-1">{o.address_name}</p>
                      <p className="text-muted-foreground">{o.address_line1}, {o.address_city} {o.address_zip}</p>
                      {o.assigned_to && !isCancelled && <p className="mt-2 text-primary flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery agent assigned</p>}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {cancelError && (
                      <p className="w-full text-xs text-destructive font-medium">{cancelError}</p>
                    )}
                    {(o.status === "placed" || o.status === "packed") && (
                      <button
                        onClick={() => handleCancel(o.id)}
                        disabled={cancellingId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60">
                        {cancellingId === o.id
                          ? <><Loader2 className="h-3 w-3 animate-spin" /> Cancelling…</>
                          : <><X className="h-3 w-3" /> Cancel order</>}
                      </button>
                    )}
                    <button onClick={() => setOpenId(openId === o.id ? null : o.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      <History className="h-3.5 w-3.5" />
                      {openId === o.id ? "Hide" : "View"} status history ({(o.order_history ?? []).length})
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openId === o.id ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {openId === o.id && (
                    <ol className="mt-4 space-y-3 border-l-2 border-dashed border-border pl-5 animate-fade-up">
                      {(o.order_history ?? []).slice().reverse().map((h: any, hi: number) => (
                        <li key={hi} className="relative">
                          <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full [background:var(--gradient-brand)] text-primary-foreground ring-4 ring-background">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          <p className="text-sm font-bold">{ORDER_LABEL[h.status as keyof typeof ORDER_LABEL] ?? h.status}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(h.at).toLocaleString()}
                          </p>
                          {h.note && <p className="mt-1 text-xs text-muted-foreground italic">"{h.note}"</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
