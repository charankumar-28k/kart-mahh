import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PageShell } from "../components/SiteLayout";
import heroCart from "../assets/hero-cart.png";
import { CATEGORIES } from "../lib/categories";
import { useSupabaseStore } from "../lib/supabase-store";
import { addToCart, setBuyNow, useCart, type BuyNowSession } from "../lib/cart-store";
import type { Tag } from "../lib/store";

// ─── Route ───────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/")({ component: Index });

// ─── Types ───────────────────────────────────────────────────────────────────
/** Mirrors the validateSearch shape declared in products.tsx */
type ProductsSearch = {
  q?: string;
  tab?: string;
  category?: string;
  sort?: string;
};

/** Mirrors the validateSearch shape declared in checkout.tsx */
type CheckoutSearch = {
  mode?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS: { key: Tag | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top", label: "Top Picks" },
  { key: "trending", label: "Trending" },
  { key: "best", label: "Best Sellers" },
  { key: "near", label: "Near You" },
];

// ─── Component ───────────────────────────────────────────────────────────────
function Index() {
  const { products, user } = useSupabaseStore();
  useCart(); // subscribe to cart updates

  // `mounted` prevents a hydration mismatch for the admin/guest CTA buttons
  // that depend on client-only auth state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<Tag | "all">("all");
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "all") list = list.filter((p) => p.tags.includes(tab));
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }
    return list;
  }, [products, tab, q]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const search: ProductsSearch = {
        q: q.trim() || undefined,
        tab: "all",
      };
      navigate({ to: "/products", search });
    },
    [navigate, q]
  );

  const handleAddToCart = useCallback(
    (productId: string) => {
      addToCart(productId);
      navigate({ to: "/cart" });
    },
    [navigate]
  );

  const handleBuyNow = useCallback(
    (productId: string, price: number) => {
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setBuyNow({ productId, qty: 1, price } as BuyNowSession);
      const search: CheckoutSearch = { mode: "buynow" };
      navigate({ to: "/checkout", search });
    },
    [navigate, user]
  );

  // ── View all search params ───────────────────────────────────────────────
  const viewAllSearch: ProductsSearch = { tab: tab === "all" ? undefined : tab };

  return (
    <PageShell>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 [background:var(--gradient-hero)]" />

        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -left-16 top-20 h-40 w-40 [background:var(--gradient-brand)] opacity-40 animate-blob blur-2xl" />
          <div className="absolute right-10 top-10 h-32 w-32 rounded-full [background:radial-gradient(circle,oklch(0.78_0.18_25),transparent_70%)] opacity-70 animate-float-slow" />
          <div className="absolute left-1/4 bottom-10 h-24 w-24 rounded-full [background:radial-gradient(circle,oklch(0.7_0.22_290),transparent_70%)] opacity-60 animate-float-fast" />
          <div className="absolute right-1/3 bottom-32 h-16 w-16 rounded-full bg-[var(--accent-orange)] opacity-30 blur-xl animate-float-slow" />
          <div className="absolute right-20 bottom-20 h-20 w-20 rounded-full border-4 border-[var(--accent-orange)] opacity-40 animate-spin-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pt-16 pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            #1 Marketplace for Local Deals
          </span>

          <h1
            className="mt-6 text-6xl font-extrabold tracking-tight md:text-8xl animate-fade-up"
            style={{ animationDelay: "80ms", fontFamily: "'Sora', sans-serif" }}
          >
            <span className="gradient-text animate-gradient">Classi</span>
            <span className="gradient-text animate-gradient">Ads</span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-base text-muted-foreground animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            Buy &amp; sell anything near you. Discover great deals on cars,
            property, electronics, fashion and everything in between.
          </p>

          {/* Search form */}
          <form
            role="search"
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-card p-2 shadow-[var(--shadow-soft)] animate-scale-pop"
            style={{ animationDelay: "280ms" }}
          >
            <Search
              className="ml-4 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find cars, mobiles, chairs..."
              aria-label="Search products"
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full [background:var(--gradient-accent)] text-white shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <Search
                className="h-4 w-4 transition-transform group-hover:rotate-12"
                aria-hidden="true"
              />
            </button>
          </form>

          {/* Tag filter chips */}
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade-up"
            style={{ animationDelay: "380ms" }}
            role="group"
            aria-label="Filter by tag"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all hover:scale-105 ${
                  tab === t.key
                    ? "[background:var(--gradient-accent)] text-white shadow-md"
                    : "bg-card text-muted-foreground hover:text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Hero image */}
          <div
            className="relative mx-auto mt-10 max-w-3xl animate-fade-up"
            style={{ animationDelay: "480ms" }}
          >
            <img
              src={heroCart}
              alt="Shopping cart filled with colourful shopping bags"
              width={1280}
              height={1024}
              className="mx-auto w-full max-w-xl animate-float-slow drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <section
        className="relative mx-auto -mt-12 max-w-7xl px-5"
        aria-label="Browse by category"
      >
        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.slice(0, 10).map((c, i) => (
            <Link
              key={c.label}
              to="/category/$slug"
              params={{ slug: c.slug }}
              style={{ animationDelay: `${i * 50}ms` }}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 hover-lift animate-fade-up"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl [background:var(--gradient-brand)] text-2xl shadow-md transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                aria-hidden="true"
              >
                {c.emoji}
              </span>
              <span className="text-xs font-semibold text-center">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3 text-center">
          <Link
            to="/category/$slug"
            params={{ slug: "fashion" }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Browse all 15 categories →
          </Link>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ─────────────────────────────────────────────── */}
      <section
        className="mx-auto mt-20 max-w-7xl px-5"
        aria-label="Featured listings"
      >
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Hot right now
            </span>
            <h2
              className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {TABS.find((t) => t.key === tab)?.label}{" "}
              <span className="gradient-text">Listings</span>
            </h2>
          </div>
          <Link
            to="/products"
            search={viewAllSearch}
            className="hidden text-sm font-semibold text-primary hover:underline md:inline-flex"
          >
            View all {filtered.length} →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card animate-fade-up hover-lift"
            >
              {/* Clickable product area */}
              <Link
                to="/product/$id"
                params={{ id: p.id }}
                className="block"
                aria-label={`View ${p.title}`}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <span
                    className="absolute left-3 top-3 rounded-full [background:var(--gradient-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                    aria-hidden="true"
                  >
                    {p.tags[0] ?? "new"}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-bold">{p.title}</h3>
                    <span
                      className="flex items-center gap-0.5 text-xs font-semibold text-[var(--accent-orange)]"
                      aria-label={`Rating: ${p.rating} out of 5`}
                    >
                      ★ {p.rating}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                    {p.category} · {p.subcategory}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-lg font-extrabold gradient-text">
                        ${p.price}
                      </span>
                      {p.oldPrice != null && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          ${p.oldPrice}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />{" "}
                      {p.location}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Add to cart — sibling of Link, not nested inside it */}
              <button
                type="button"
                onClick={() => handleAddToCart(p.id)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/95 text-foreground backdrop-blur shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95"
                aria-label={`Add ${p.title} to cart`}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Buy Now — sibling of Link, not nested inside it */}
              <button
                type="button"
                onClick={() => handleBuyNow(p.id, p.price)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex items-center gap-1 rounded-full [background:var(--gradient-brand)] px-4 py-1.5 text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
                aria-label={`Buy ${p.title} now`}
              >
                <Zap className="h-3 w-3" aria-hidden="true" /> Buy Now
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            No products match your search.
          </p>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-5" aria-label="Call to action">
        <div className="relative overflow-hidden rounded-3xl [background:var(--gradient-hero)] p-8 md:p-14">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full [background:var(--gradient-brand)] opacity-30 blur-3xl animate-blob"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-[var(--accent-orange)] opacity-30 blur-2xl animate-float-slow"
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div className="animate-fade-up">
              <h3
                className="text-4xl font-extrabold tracking-tight md:text-5xl"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Buy &amp; Sell{" "}
                <span className="gradient-text">Anything</span> Near You
              </h3>
              <p className="mt-4 max-w-md text-muted-foreground">
                Discover great deals on anything from anywhere in the world.
                Start selling in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {mounted && user?.role === "admin" && (
                  <Link
                    to="/post-ad"
                    className="group inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
                  >
                    Post your ad
                    <ChevronRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                )}
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 rounded-full [background:var(--gradient-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
                >
                  Browse all products
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                {mounted && !user && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <img
                src={heroCart}
                alt=""
                loading="lazy"
                aria-hidden="true"
                className="ml-auto w-full max-w-sm animate-float-slow drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
