import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Zap, MapPin, Shield, Truck, RotateCcw, Plus, Minus, ChevronLeft, Star, Edit3, MessageSquare, Heart } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { addToCart, setBuyNow } from "../lib/cart-store";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

const EMPTY_WISHLIST: string[] = [];

function ProductPage() {
  const { id } = Route.useParams();

  const productId = id;
  const { products, user, addReview, toggleWishlist } = useSupabaseStore();
  const product = products.find((p) => p.id === productId) ?? null;
  const wishlist = user?.wishlist ?? EMPTY_WISHLIST;
  const related = products.filter((p) => p.id !== productId && p.category === product?.category).slice(0, 4);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const navigate = useNavigate();
  const alreadyReviewed = !!(user && product?.reviews?.some((r: any) => r.user_id === user.id));

  if (!product) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-3xl font-extrabold">Product not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Back home</Link>
        </div>
      </PageShell>
    );
  }

  const handleAdd = () => {
    addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuy = () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBuyNow({ productId: product.id, qty, price: product.price });
    navigate({ to: "/checkout", search: { mode: "buynow" } as any });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <Link to="/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-3 w-3" /> Back to products
          </Link>
          {user?.role === "admin" && (
            <Link to="/admin" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20">
              <Edit3 className="h-3 w-3" /> Edit in admin
            </Link>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative animate-fade-up">
            <div className="absolute -inset-4 [background:var(--gradient-brand)] opacity-20 blur-3xl rounded-3xl" />
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)] aspect-square">
              <img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              <span className="absolute left-4 top-4 rounded-full [background:var(--gradient-accent)] px-3 py-1 text-[10px] font-bold uppercase text-white">
                {product.tags[0] ?? "new"}
              </span>
              {user && (
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur shadow-md transition-all hover:scale-110 ${wishlist.includes(product.id) ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"}`}
                >
                  <Heart className="h-5 w-5" fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-primary capitalize">{product.category} · {product.subcategory}</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {product.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm flex-wrap">
              <span className="text-[var(--accent-orange)] font-semibold">★ {product.rating}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {product.location}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{product.stock} in stock</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-extrabold gradient-text">${product.price}</span>
              {product.old_price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">${product.old_price}</span>
                  <span className="rounded-full bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold">
                    -{Math.round((1 - product.price / product.old_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center rounded-full border border-border bg-card overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-secondary transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-4 text-sm font-bold w-10 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 hover:bg-secondary transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleAdd}
                className={`group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] active:scale-95 ${added ? "bg-primary text-primary-foreground" : ""}`}
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? "Added ✓" : "Add to cart"}
              </button>
              <button
                onClick={handleBuy}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Zap className="h-4 w-4" />
                Buy now
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
              {[
                [Truck, "Free Delivery"],
                [Shield, "2-Year Warranty"],
                [RotateCcw, "7-Day Returns"],
              ].map(([Icon, label]: any) => (
                <div key={label} className="rounded-xl border border-border bg-card p-3 text-center hover-lift">
                  <Icon className="mx-auto h-5 w-5 text-primary mb-1" />
                  <p className="font-semibold">{label}</p>
                </div>
              ))}
            </div>


          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              Customer <span className="gradient-text">Reviews</span>
            </h2>
            <span className="text-sm text-muted-foreground">{product.reviews?.length ?? 0} reviews · ★ {product.rating}</span>
          </div>

          {user && user.role !== "admin" && (
            alreadyReviewed ? (
              <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                ✓ You've already reviewed this product.
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (reviewText.trim()) { addReview(product.id, reviewRating, reviewText.trim()); setReviewText(""); } }}
                className="mb-6 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}>
                      <Star className={`h-5 w-5 ${n <= reviewRating ? "fill-[var(--accent-orange)] text-[var(--accent-orange)]" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">Your rating</span>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                />
                <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-primary-foreground hover:scale-105 transition-transform">
                  <MessageSquare className="h-3.5 w-3.5" /> Post review
                </button>
              </form>
            )
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {(product.reviews ?? []).map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 hover-lift">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                    {(r as any).user_name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{(r as any).user_name}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-[var(--accent-orange)] text-[var(--accent-orange)]" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
            {(!product.reviews || product.reviews.length === 0) && (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
            )}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              You might also <span className="gradient-text">like</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group block rounded-2xl border border-border bg-card overflow-hidden hover-lift">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-bold">{p.title}</h3>
                    <span className="text-sm font-extrabold gradient-text">${p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
