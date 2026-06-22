import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Heart,
  ShoppingCart, Tag, Truck, Shield, RotateCcw, Gift,
  CheckCircle2, X, ChevronRight, Star
} from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { useCart, setQty, removeFromCart, clearCart, addToCart } from "../lib/cart-store";

export const Route = createFileRoute("/cart")({ component: CartPage });

const PROMO_CODES: Record<string, number> = {
  SAVE10: 10,
  WELCOME20: 20,
  CLASSI15: 15,
};

// Stable empty array
const EMPTY_WL: string[] = [];

function CartPage() {
  // ── Primitive / stable selectors only ──────────────────────────────
  const { products, user, toggleWishlist } = useSupabaseStore();
  const cartItems = useCart();
  const wishlist = user?.wishlist ?? EMPTY_WL;

  // ── Derive cart line items in useMemo — NOT inside useStore ─────────
  const items = useMemo(
    () =>
      cartItems
        .map((c) => {
          const p = products.find((x) => x.id === c.productId);
          if (!p) return null;
          return {
            id: p.id,
            productId: c.productId,
            title: p.title,
            price: p.price,
            oldPrice: p.old_price,
            image: p.image,
            category: p.category,
            subcategory: p.subcategory,
            stock: p.stock ?? 99,
            rating: p.rating,
            qty: c.qty,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [cartItems, products]
  );

  // ── Suggested products derived in useMemo ──────────────────────────
  const suggested = useMemo(() => {
    const cartIds = new Set(cartItems.map((c) => c.productId));
    const cats = [...new Set(
      cartItems
        .map((c) => products.find((p) => p.id === c.productId)?.category)
        .filter((c): c is string => Boolean(c))
    )];
    if (!cats.length) return [];
    return products.filter((p) => cats.includes(p.category) && !cartIds.has(p.id)).slice(0, 4);
  }, [cartItems, products]);

  // ── Local UI state ─────────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ── Derived totals (pure computation, no setState) ─────────────────
  const subtotal = useMemo(() => items.reduce((t, i) => t + i.price * i.qty, 0), [items]);
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const discount = appliedPromo ? Math.round((subtotal * PROMO_CODES[appliedPromo]) / 100 * 100) / 100 : 0;
  const total = subtotal + shipping - discount;
  const savings = useMemo(() => items.reduce((t, i) => t + ((i.oldPrice ?? i.price) - i.price) * i.qty, 0), [items]);
  const totalQty = useMemo(() => items.reduce((t, i) => t + i.qty, 0), [items]);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError("");
      setPromoInput("");
    } else {
      setPromoError("Invalid code. Try: SAVE10 · WELCOME20 · CLASSI15");
    }
  };

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    setTimeout(() => { removeFromCart(productId); setRemovingId(null); }, 280);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-5 py-10">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                Your <span className="gradient-text">Cart</span>
              </h1>
              <p className="text-sm text-muted-foreground">{totalQty} {totalQty === 1 ? "item" : "items"}</p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all items?")) clearCart(); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear cart
            </button>
          )}
        </div>

        {/* Trust bar */}
        <div className="mt-4 flex flex-wrap gap-2 animate-fade-up">
          {([
            [Truck, "Free shipping over $100"],
            [Shield, "Secure checkout"],
            [RotateCcw, "7-day returns"],
            [Gift, "Gift wrapping"],
          ] as const).map(([Icon, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />{label}
            </span>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center animate-fade-up">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add some items to get started.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
                Start shopping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                Browse all products
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* Left column */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.productId}
                  style={{ animationDelay: `${idx * 50}ms`, transition: "opacity 0.28s, transform 0.28s" }}
                  className={`rounded-2xl border border-border bg-card p-4 animate-fade-up ${
                    removingId === item.productId ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <div className="flex gap-4">
                    <Link to="/product/$id" params={{ id: item.id }}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted block">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                      {item.oldPrice && (
                        <span className="absolute left-1 top-1 rounded-md bg-[var(--accent-orange)] px-1 py-0.5 text-[9px] font-bold text-white">
                          -{Math.round((1 - item.price / item.oldPrice) * 100)}%
                        </span>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <Link to="/product/$id" params={{ id: item.id }}
                            className="font-bold text-sm hover:text-primary transition-colors block truncate">
                            {item.title}
                          </Link>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.category} · {item.subcategory}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className={`h-2.5 w-2.5 ${n <= Math.round(item.rating) ? "fill-[var(--accent-orange)] text-[var(--accent-orange)]" : "text-border"}`} />
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-0.5">{item.rating}</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemove(item.productId)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg font-extrabold gradient-text">${item.price.toFixed(2)}</span>
                        {item.oldPrice && <span className="text-xs text-muted-foreground line-through">${item.oldPrice.toFixed(2)}</span>}
                      </div>

                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-secondary p-1">
                          <button onClick={() => setQty(item.productId, item.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-card transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                          <button onClick={() => setQty(item.productId, item.qty + 1)}
                            disabled={item.qty >= item.stock}
                            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">${(item.price * item.qty).toFixed(2)}</span>
                          {user && (
                            <button onClick={() => toggleWishlist(item.productId)}
                              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                                wishlist.includes(item.productId) ? "bg-rose-50 text-rose-500" : "bg-secondary text-muted-foreground hover:text-rose-400"
                              }`}>
                              <Heart className="h-4 w-4" fill={wishlist.includes(item.productId) ? "currentColor" : "none"} />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.stock > 0 && item.stock <= 5 && (
                        <p className="mt-1.5 text-[11px] font-semibold text-[var(--accent-orange)]">⚡ Only {item.stock} left!</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Promo code */}
              <div className="rounded-2xl border border-border bg-card p-4 animate-fade-up">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Promo code</span>
                  {appliedPromo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> {appliedPromo}
                    </span>
                  )}
                </div>
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                    <span className="text-sm font-semibold text-emerald-700">{PROMO_CODES[appliedPromo]}% off — saving ${discount.toFixed(2)}</span>
                    <button onClick={() => setAppliedPromo(null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") applyPromo(); }}
                      placeholder="Enter promo code"
                      className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-card transition-all" />
                    <button onClick={applyPromo}
                      className="rounded-xl [background:var(--gradient-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-transform">
                      Apply
                    </button>
                  </div>
                )}
                {promoError && <p className="mt-2 text-xs text-destructive">{promoError}</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">Try: SAVE10 · WELCOME20 · CLASSI15</p>
              </div>
            </div>

            {/* Order summary */}
            <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-border bg-card p-6 animate-fade-up">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 mb-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {item.qty}
                        </span>
                      </div>
                      <span className="flex-1 truncate text-xs text-muted-foreground">{item.title}</span>
                      <span className="text-xs font-semibold flex-shrink-0">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({totalQty} items)</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={`font-semibold ${shipping === 0 ? "text-emerald-600" : ""}`}>
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {shipping > 0 && (
                    <div className="rounded-lg bg-secondary px-3 py-2 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Add ${(100 - subtotal).toFixed(2)} for free shipping</span>
                        <span className="font-semibold">{Math.min(100, Math.round((subtotal / 100) * 100))}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full [background:var(--gradient-brand)] transition-all duration-500"
                          style={{ width: `${Math.min(100, (subtotal / 100) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-medium">Promo ({appliedPromo})</span>
                      <span className="font-semibold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {(savings + discount) > 0 && (
                    <div className="flex justify-between text-[var(--accent-orange)]">
                      <span className="font-medium">Total savings</span>
                      <span className="font-semibold">-${(savings + discount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-base">Total</span>
                    <span className="text-2xl font-extrabold gradient-text">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <Link to="/checkout"
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-95">
                    <ShoppingCart className="h-4 w-4" />
                    Proceed to Checkout
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span className="pointer-events-none absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
                  </Link>
                  <Link to="/products"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary transition-colors">
                    ← Continue Shopping
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SSL Secured</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Easy Returns</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Suggested products */}
        {suggested.length > 0 && items.length > 0 && (
          <section className="mt-16 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>
                You might also <span className="gradient-text">like</span>
              </h2>
              <Link to="/products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                See all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {suggested.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 60}ms` }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden animate-fade-up hover-lift">
                  <Link to="/product/$id" params={{ id: p.id }}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img src={p.image} alt={p.title} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {p.old_price && (
                        <span className="absolute left-2 top-2 rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-[10px] font-bold text-white">
                          -{Math.round((1 - p.price / p.old_price) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold">{p.title}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-extrabold gradient-text">${p.price}</span>
                        <span className="text-[10px] text-[var(--accent-orange)]">★ {p.rating}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button onClick={() => addToCart(p.id)}
                      className="w-full rounded-xl border border-border bg-secondary py-2 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      + Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
