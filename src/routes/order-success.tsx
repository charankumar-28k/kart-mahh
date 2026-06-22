import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, MapPin, Clock } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { ORDER_LABEL } from "../lib/store";
import * as api from "../lib/api";

export const Route = createFileRoute("/order-success")({
  validateSearch: (s: Record<string, unknown>) => ({ orderId: (s.orderId as string) ?? "" }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderId } = Route.useSearch();
  const navigate = useNavigate();
  const { orders } = useSupabaseStore();
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [fetching, setFetching] = useState(false);

  const storeOrder = orders.find((o: any) => o.id === orderId) as any ?? null;
  const order = storeOrder ?? fetchedOrder;

  useEffect(() => {
    if (!orderId) { navigate({ to: "/" }); return; }
    // If not in store yet, fetch directly from Supabase
    if (!storeOrder && !fetchedOrder && !fetching) {
      setFetching(true);
      api.getOrderById(orderId)
        .then((o) => setFetchedOrder(o))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [orderId, storeOrder, fetchedOrder, fetching]);

  const shipment = (order?.shipments ?? [])[0] ?? null;

  if (!order) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          {fetching
            ? <p className="text-muted-foreground">Loading order...</p>
            : <><p className="text-muted-foreground">Order not found.</p><Link to="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link></>
          }
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-5 py-16 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl [background:var(--gradient-brand)] p-8 text-center text-white mb-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <CheckCircle2 className="mx-auto h-16 w-16 drop-shadow-lg" />
          <h1 className="mt-4 text-3xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>Order Confirmed!</h1>
          <p className="mt-2 text-white/80 text-sm">Thank you for your purchase. We'll get it to you soon.</p>
          <p className="mt-3 font-mono text-xs bg-white/20 rounded-full px-4 py-1.5 inline-block">{order.id}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Items ordered</h2>
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
          </div>
          <div className="border-t border-border" />
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shipping == 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Total</span><span className="gradient-text text-xl">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="rounded-xl bg-secondary p-4 text-sm">
            <p className="font-bold flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" /> Delivering to</p>
            <p className="font-semibold">{order.address_name}</p>
            <p className="text-muted-foreground">{order.address_line1}, {order.address_city} {order.address_zip}</p>
            <p className="text-muted-foreground">{order.address_phone}</p>
          </div>
          {shipment && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
              <p className="font-bold flex items-center gap-2 mb-2"><Truck className="h-4 w-4 text-primary" /> Shipment details</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Courier: <span className="font-semibold text-foreground">{shipment.courier_partner}</span></p>
                <p>Tracking: <span className="font-mono font-semibold text-foreground">{shipment.tracking_number}</span></p>
                <p>Est. delivery: <span className="font-semibold text-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(shipment.estimated_delivery_date).toLocaleDateString()}</span></p>
                <p>Status: <span className="font-semibold text-primary capitalize">{ORDER_LABEL[shipment.shipment_status as keyof typeof ORDER_LABEL]}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/orders/$orderId" params={{ orderId: order.id }} className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">Track order</Link>
          <Link to="/orders" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary transition-colors">All orders</Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">Continue shopping</Link>
        </div>
      </div>
    </PageShell>
  );
}
