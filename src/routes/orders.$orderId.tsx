import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Truck, MapPin, Clock, Package, ChevronLeft, AlertCircle, Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { ORDER_STAGES, ORDER_LABEL } from "../lib/store";

export const Route = createFileRoute("/orders/$orderId")({ component: OrderTrackingPage });

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  const { user, orders, addReview } = useSupabaseStore();
  const order = orders.find((o: any) => o.id === orderId) as any ?? null;

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <Link to="/login" className="rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground">Sign in to track</Link>
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center animate-fade-up">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Order not found</h1>
          <Link to="/orders" className="mt-4 inline-block text-primary hover:underline">← My orders</Link>
        </div>
      </PageShell>
    );
  }

  const isCancelled = order.status === "cancelled";
  const stageIdx = isCancelled ? -1 : ORDER_STAGES.indexOf(order.status);
  const shipment = (order.shipments ?? [])[0] ?? null;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-5 py-10 space-y-6 animate-fade-up">
        <Link to="/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-3 w-3" /> Back to orders
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Order <span className="gradient-text">Tracking</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">{order.id}</p>
        </div>

        {!isCancelled && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">Delivery Progress</h2>
            <div className="flex items-start">
              {ORDER_STAGES.map((stage, i) => {
                const active = i <= stageIdx; const isCurrent = i === stageIdx;
                return (
                  <div key={stage} className="flex-1 flex flex-col items-center relative">
                    {i > 0 && <div className={`absolute top-4 right-1/2 h-0.5 w-full transition-colors ${i <= stageIdx ? "bg-primary" : "bg-border"}`} />}
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all ${active ? "[background:var(--gradient-brand)] text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "scale-125 animate-pulse-ring" : ""}`}>
                      {active ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`mt-2 text-[10px] font-semibold text-center leading-tight px-1 ${active ? "text-foreground" : "text-muted-foreground"}`}>{ORDER_LABEL[stage]}</span>
                    {isCurrent && <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="font-bold text-destructive">This order was cancelled</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {shipment && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Shipment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Courier</span><span className="font-semibold">{shipment.courier_partner}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tracking #</span><span className="font-mono font-semibold">{shipment.tracking_number}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Est. delivery</span>
                  <span className="font-semibold">{new Date(shipment.estimated_delivery_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-primary capitalize">{ORDER_LABEL[shipment.shipment_status as keyof typeof ORDER_LABEL]}</span></div>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery address</h2>
            <p className="font-semibold text-sm">{order.address_name}</p>
            <p className="text-sm text-muted-foreground">{order.address_line1}</p>
            <p className="text-sm text-muted-foreground">{order.address_city} {order.address_zip}</p>
            <p className="text-sm text-muted-foreground">{order.address_phone}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Items</h2>
          <div className="space-y-3">
            {(order.order_items ?? []).map((i: any) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <img src={i.image} alt={i.title} className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1 truncate font-medium">{i.title}</span>
                <span className="text-muted-foreground">× {i.qty}</span>
                <span className="font-bold w-16 text-right">${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shipping == 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span className="gradient-text">${Number(order.total).toFixed(2)}</span></div>
          </div>
        </div>

        {order.status === "delivered" && (
          <ReviewSection items={order.order_items ?? []} userId={user.id} addReview={addReview} />
        )}

        {(order.order_history ?? []).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Status History</h2>
            <ol className="space-y-3 border-l-2 border-dashed border-border pl-5">
              {(order.order_history ?? []).slice().reverse().map((h: any, hi: number) => (
                <li key={hi} className="relative">
                  <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full [background:var(--gradient-brand)] text-primary-foreground ring-4 ring-background">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <p className="text-sm font-bold">{ORDER_LABEL[h.status as keyof typeof ORDER_LABEL] ?? h.status}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(h.at).toLocaleString()}</p>
                  {h.note && <p className="mt-0.5 text-xs text-muted-foreground italic">"{h.note}"</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function ReviewSection({ items, userId, addReview }: { items: any[]; userId: string; addReview: (productId: string, rating: number, comment: string) => Promise<void> }) {
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  const isDone = (productId: string) => submitted.has(productId);
  const allDone = items.every((i) => isDone(i.product_id));

  const handleSubmit = async (productId: string) => {
    if (!comment.trim()) return;
    await addReview(productId, rating, comment.trim());
    setSubmitted((prev) => new Set(prev).add(productId));
    setActiveId(null);
    setComment("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Star className="h-4 w-4 fill-[var(--accent-orange)] text-[var(--accent-orange)]" /> Rate Your Purchase
        </h2>
        {!allDone && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">{items.filter((i) => !isDone(i.product_id)).length} pending</span>}
      </div>
      {allDone ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">You've reviewed all products — thank you!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const done = isDone(item.product_id);
            const isActive = activeId === item.product_id;
            return (
              <div key={item.product_id} className={`rounded-xl border overflow-hidden transition-all ${done ? "border-emerald-200 bg-emerald-50/50" : isActive ? "border-primary bg-primary/5" : "border-border bg-secondary/30"}`}>
                <div className="flex items-center gap-3 p-3">
                  <img src={item.image} alt={item.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    {done && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Reviewed</span>}
                  </div>
                  {!done && (
                    <button onClick={() => { setActiveId(isActive ? null : item.product_id); setRating(5); setHovered(0); setComment(""); }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${isActive ? "bg-muted text-muted-foreground" : "[background:var(--gradient-brand)] text-primary-foreground hover:scale-105"}`}>
                      {isActive ? "Cancel" : "Write review"}
                    </button>
                  )}
                </div>
                {isActive && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-up">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-125">
                          <Star className={`h-7 w-7 transition-colors ${n <= (hovered || rating) ? "fill-[var(--accent-orange)] text-[var(--accent-orange)]" : "text-border"}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-[var(--accent-orange)]">{RATING_LABELS[hovered || rating]}</span>
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} placeholder="Share your experience…" rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSubmit(item.product_id)} disabled={!comment.trim()}
                        className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-5 py-2 text-xs font-semibold text-primary-foreground hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                        <MessageSquare className="h-3.5 w-3.5" /> Submit review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
