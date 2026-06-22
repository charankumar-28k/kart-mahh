import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { CreditCard, Wallet, Banknote, Check, MapPin, ChevronLeft, ShieldCheck, AlertCircle, Plus, Loader2, Package } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { useCart, clearCart, getBuyNow, clearBuyNow } from "../lib/cart-store";
import { z } from "zod";
import * as api from "../lib/api";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type Step = "address" | "payment" | "review";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Amex" },
  { id: "wallet", label: "Digital Wallet", icon: Wallet, desc: "Apple Pay, Google Pay" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive" },
];

const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number"),
  line1: z.string().min(5, "Enter a valid street address"),
  city: z.string().min(2, "Enter a city"),
  zip: z.string().regex(/^[A-Za-z0-9\s\-]{3,10}$/, "Enter a valid ZIP/postal code"),
});

type AddressErrors = Partial<Record<keyof z.infer<typeof addressSchema>, string>>;
type Address = { name: string; phone: string; line1: string; city: string; zip: string };
const TAX_RATE = 0.08;

function Field({ fkey, label, ph, newAddr, setNewAddr, addressErrors }: {
  fkey: keyof Address; label: string; ph: string;
  newAddr: Address; setNewAddr: React.Dispatch<React.SetStateAction<Address>>;
  addressErrors: AddressErrors;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input value={newAddr[fkey]} onChange={(e) => setNewAddr((prev) => ({ ...prev, [fkey]: e.target.value }))} placeholder={ph}
        className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:bg-card focus:shadow-[var(--shadow-soft)] bg-secondary ${addressErrors[fkey] ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`} />
      {addressErrors[fkey] && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" /> {addressErrors[fkey]}</p>}
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, savedAddresses, placeOrder } = useSupabaseStore();
  const cartItems = useCart();
  const { products } = useSupabaseStore();
  const buyNowSession = getBuyNow();
  const isBuyNow = !!buyNowSession;

  const lineItems = useMemo(() => {
    if (isBuyNow && buyNowSession) {
      const p = products.find((x) => x.id === buyNowSession.productId);
      if (!p) return [];
      return [{ id: p.id, title: p.title, price: buyNowSession.price, qty: buyNowSession.qty, image: p.image }];
    }
    return cartItems.map((c) => {
      const p = products.find((x) => x.id === c.productId);
      return p ? { id: p.id, title: p.title, price: p.price, qty: c.qty, image: p.image } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [isBuyNow, buyNowSession, cartItems, products]);

  const subtotal = useMemo(() => lineItems.reduce((t, i) => t + i.price * i.qty, 0), [lineItems]);
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + shipping + tax;

  const [step, setStep] = useState<Step>("address");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(savedAddresses.length > 0 ? savedAddresses[0].id : null);
  const [useNewAddress, setUseNewAddress] = useState(savedAddresses.length === 0);
  const [newAddr, setNewAddr] = useState<Address>({ name: user?.name ?? "", phone: user?.phone ?? "", line1: "", city: "", zip: "" });
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [payment, setPayment] = useState("card");
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);

  if (!user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center animate-fade-up">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Sign in to checkout</h1>
          <Link to="/login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">Go to login</Link>
        </div>
      </PageShell>
    );
  }

  if (lineItems.length === 0) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center animate-fade-up">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Nothing to checkout</h1>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">← Continue shopping</Link>
        </div>
      </PageShell>
    );
  }

  const resolvedAddress = (): Address | null => {
    if (useNewAddress) return newAddr;
    const saved = savedAddresses.find((a) => a.id === selectedSavedId);
    if (!saved) return null;
    return { name: saved.name, phone: saved.phone, line1: saved.line1, city: saved.city, zip: saved.zip };
  };

  const validateAddress = (): boolean => {
    if (!useNewAddress) return !!selectedSavedId;
    const result = addressSchema.safeParse(newAddr);
    if (result.success) { setAddressErrors({}); return true; }
    const errs: AddressErrors = {};
    result.error.errors.forEach((e) => { if (e.path[0]) errs[e.path[0] as keyof AddressErrors] = e.message; });
    setAddressErrors(errs);
    return false;
  };

  const place = async () => {
    if (placingRef.current) return;
    const addr = resolvedAddress();
    if (!addr) return;
    placingRef.current = true;
    setPlacing(true);
    try {
      const orderId = "ord_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const shipmentId = "shp_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const trackingNumber = "TRK" + Math.random().toString(36).slice(2, 10).toUpperCase();

      // 1. Place order first (shipments FK depends on orders)
      await placeOrder({
        id: orderId, userId: user.id,
        items: lineItems.map((i) => ({ productId: i.id, title: i.title, price: i.price, qty: i.qty, image: i.image })),
        subtotal, tax, shipping, total,
        address: addr, payment,
        shipmentId,
        transactionRef: "txn_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      });

      // 2. Create shipment after order exists
      await api.createShipment({
        id: shipmentId, orderId,
        courierPartner: "ClassiShip Express",
        trackingNumber,
        estimatedDeliveryDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
      });

      if (!isBuyNow) clearCart();
      else clearBuyNow();
      navigate({ to: "/order-success", search: { orderId } as any });
    } catch (err) {
      console.error("Place order error:", err);
      alert("Failed to place order: " + (err as any)?.message);
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  };

  const steps: { id: Step; label: string }[] = [{ id: "address", label: "Address" }, { id: "payment", label: "Payment" }, { id: "review", label: "Review" }];

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link to={isBuyNow ? "/products" : "/cart"} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary" onClick={() => { if (isBuyNow) clearBuyNow(); }}>
          <ChevronLeft className="h-3 w-3" /> {isBuyNow ? "Back to products" : "Back to cart"}
        </Link>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight animate-fade-up" style={{ fontFamily: "'Sora', sans-serif" }}>
          <span className="gradient-text">Checkout</span>
          {isBuyNow && <span className="ml-3 text-sm font-semibold rounded-full bg-primary/10 text-primary px-3 py-1 align-middle">Buy Now</span>}
        </h1>

        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => {
            const active = s.id === step;
            const done = steps.findIndex((x) => x.id === step) > i;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${active ? "[background:var(--gradient-brand)] text-primary-foreground scale-110 animate-pulse-ring" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-0.5 w-10 transition-colors ${done ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-card p-6 animate-fade-up">
            {step === "address" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Delivery address</h2>
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    {savedAddresses.map((a) => (
                      <button key={a.id} type="button" onClick={() => { setSelectedSavedId(a.id); setUseNewAddress(false); }}
                        className={`w-full flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${!useNewAddress && selectedSavedId === a.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary">
                          {!useNewAddress && selectedSavedId === a.id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-primary">{a.label}</p>
                          <p className="text-sm font-semibold">{a.name} · {a.phone}</p>
                          <p className="text-xs text-muted-foreground">{a.line1}, {a.city} {a.zip}</p>
                        </div>
                      </button>
                    ))}
                    <button type="button" onClick={() => setUseNewAddress(true)}
                      className={`w-full flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${useNewAddress ? "border-primary bg-primary/5" : "border-dashed border-border hover:border-primary/40"}`}>
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-primary">Use a new address</span>
                    </button>
                  </div>
                )}
                {useNewAddress && (
                  <div className="space-y-3 pt-2">
                    <Field fkey="name" label="Full name" ph="Jane Doe" newAddr={newAddr} setNewAddr={setNewAddr} addressErrors={addressErrors} />
                    <Field fkey="phone" label="Phone" ph="+1 555 123 4567" newAddr={newAddr} setNewAddr={setNewAddr} addressErrors={addressErrors} />
                    <Field fkey="line1" label="Street address" ph="123 Main St, Apt 4B" newAddr={newAddr} setNewAddr={setNewAddr} addressErrors={addressErrors} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field fkey="city" label="City" ph="Brooklyn" newAddr={newAddr} setNewAddr={setNewAddr} addressErrors={addressErrors} />
                      <Field fkey="zip" label="ZIP / Postal code" ph="11201" newAddr={newAddr} setNewAddr={setNewAddr} addressErrors={addressErrors} />
                    </div>
                  </div>
                )}
                <button onClick={() => { if (validateAddress()) setStep("payment"); }}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-95">
                  Continue to payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Payment method</h2>
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon; const active = payment === m.id;
                  return (
                    <button key={m.id} onClick={() => setPayment(m.id)}
                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover-lift ${active ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]" : "border-border bg-card"}`}>
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${active ? "[background:var(--gradient-brand)] text-primary-foreground" : "bg-muted"}`}><Icon className="h-5 w-5" /></span>
                      <div className="flex-1"><p className="font-semibold text-sm">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
                      {active && <Check className="h-5 w-5 text-primary animate-scale-pop" />}
                    </button>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("address")} className="flex-1 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary">Back</button>
                  <button onClick={() => setStep("review")} className="flex-1 rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform">Review order</button>
                </div>
              </div>
            )}

            {step === "review" && (() => {
              const addr = resolvedAddress();
              return (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Review your order</h2>
                  {addr && (
                    <div className="rounded-xl bg-secondary p-4 text-sm">
                      <p className="font-semibold">{addr.name}</p>
                      <p className="text-muted-foreground">{addr.line1}, {addr.city} {addr.zip}</p>
                      <p className="text-muted-foreground">{addr.phone}</p>
                    </div>
                  )}
                  <div className="rounded-xl bg-secondary p-4 text-sm capitalize">
                    <span className="text-xs text-muted-foreground">Payment: </span>
                    <span className="font-semibold">{PAYMENT_METHODS.find((p) => p.id === payment)?.label}</span>
                  </div>
                  <div className="rounded-xl border border-border p-4 space-y-2">
                    {lineItems.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 text-sm">
                        <img src={i.image} alt={i.title} className="h-12 w-12 rounded-lg object-cover" />
                        <span className="flex-1 truncate font-medium">{i.title}</span>
                        <span className="text-muted-foreground">× {i.qty}</span>
                        <span className="font-bold w-16 text-right">${(i.price * i.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep("payment")} className="flex-1 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary">Back</button>
                    <button onClick={place} disabled={placing}
                      className="group relative flex-1 overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2">
                      {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <>Place order — ${total.toFixed(2)}</>}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-24 animate-fade-up">
            <h2 className="text-lg font-bold">Summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items ({lineItems.length})</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-extrabold gradient-text">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {lineItems.map((i) => (
                <div key={i.id} className="flex items-center gap-2">
                  <img src={i.image} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                  <span className="truncate flex-1">{i.title}</span>
                  <span>×{i.qty}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
