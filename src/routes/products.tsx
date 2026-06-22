import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, MapPin, Filter, SlidersHorizontal, X, ShoppingCart, ArrowUpDown, Zap } from "lucide-react";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";
import { addToCart, useCart } from "../lib/cart-store";
import { CATEGORIES } from "../lib/categories";

type SearchT = { q?: string; tab?: string; category?: string; sort?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): SearchT => ({
    q: typeof s.q === "string" ? s.q : undefined,
    tab: typeof s.tab === "string" ? s.tab : "all",
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : "default",
  }),
  component: ProductsPage,
});

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "new", label: "New Arrivals" },
  { key: "top", label: "Top Picks" },
  { key: "trending", label: "Trending" },
  { key: "best", label: "Best Sellers" },
  { key: "near", label: "Near You" },
];

const SORTS = [
  { key: "default", label: "Default" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "rating", label: "Top Rated" },
];

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const { products } = useSupabaseStore();
  useCart();
  const [q, setQ] = useState(search.q ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => { setQ(search.q ?? ""); }, [search.q]);

  const tab = search.tab ?? "all";
  const category = search.category;
  const sort = search.sort ?? "default";

  const setSearch = (next: Partial<SearchT>) =>
    navigate({ search: (prev: any) => ({ ...prev, ...next }) });

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(productId);
    setAddedId(productId);
    setTimeout(() => { setAddedId(null); navigate({ to: "/cart" }); }, 600);
  };

  const handleBuyNow = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(productId);
    navigate({ to: "/checkout" });
  };

  const list = useMemo(() => {
    let l = [...products];
    if (category) l = l.filter((p) => p.category === category);
    if (tab === "top" || tab === "trending" || tab === "best" || tab === "near") {
      l = l.filter((p) => p.tags.includes(tab as any));
    } else if (tab === "new") {
      l = l.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 24);
    }
    const term = (search.q ?? "").trim().toLowerCase();
    if (term) {
      l = l.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.subcategory.toLowerCase().includes(term),
      );
    }
    if (sort === "price_asc") l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") l = [...l].sort((a, b) => b.price - a.price);
    else if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    else if (tab === "top") l = [...l].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
    return l;
  }, [products, tab, category, search.q, sort]);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 [background:var(--gradient-hero)] opacity-60" />
        <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 [background:var(--gradient-brand)] opacity-30 animate-blob blur-2xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 pt-8 pb-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight animate-fade-up" style={{ fontFamily: "'Sora', sans-serif" }}>
            Shop <span className="gradient-text">{TABS.find((t) => t.key === tab)?.label ?? "All"}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{list.length} products found{search.q ? ` for "${search.q}"` : ""}</p>

          <form
            onSubmit={(e) => { e.preventDefault(); setSearch({ q: q.trim() || undefined }); }}
            className="mt-5 flex max-w-2xl items-center gap-2 rounded-full bg-card p-2 shadow-[var(--shadow-soft)] animate-scale-pop"
          >
            <Search className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all products..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); setSearch({ q: undefined }); }} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="submit" className="rounded-full [background:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white hover:scale-105 transition-transform">
              Search
            </button>
          </form>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setSearch({ tab: t.key })}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${
                  tab === t.key ? "[background:var(--gradient-accent)] text-white shadow-md" : "bg-card text-muted-foreground hover:text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-5 py-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className={`${showFilters ? "block" : "hidden"} md:block rounded-2xl border border-border bg-card p-4 h-fit md:sticky md:top-24 animate-fade-up`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Filter className="h-3 w-3" /> Categories
            </div>
            <button onClick={() => setShowFilters(false)} className="md:hidden text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            <button
              onClick={() => setSearch({ category: undefined })}
              className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!category ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              All categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSearch({ category: c.slug })}
                className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                <span className="mr-1">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <ArrowUpDown className="h-3 w-3" /> Sort
            </div>
            <div className="space-y-1">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSearch({ sort: s.key })}
                  className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${sort === s.key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowFilters(true)} className="md:hidden inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-xs font-semibold">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>
            {/* Active filters */}
            {category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {CATEGORIES.find((c) => c.slug === category)?.label}
                <button onClick={() => setSearch({ category: undefined })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {search.q && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                "{search.q}"
                <button onClick={() => { setQ(""); setSearch({ q: undefined }); }}><X className="h-3 w-3" /></button>
              </span>
            )}
            {sort !== "default" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                {SORTS.find((s) => s.key === sort)?.label}
                <button onClick={() => setSearch({ sort: "default" })}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center animate-fade-up">
              <p className="text-muted-foreground">No products match your filters.</p>
              <button onClick={() => { setSearch({ q: undefined, tab: "all", category: undefined, sort: "default" }); setQ(""); }} className="mt-4 text-sm font-semibold text-primary hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p, i) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card animate-fade-up hover-lift block"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute left-3 top-3 rounded-full [background:var(--gradient-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {p.tags[0] ?? "new"}
                    </span>
                    <button
                      onClick={(e) => handleBuyNow(e, p.id)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex items-center gap-1 rounded-full [background:var(--gradient-brand)] px-4 py-1.5 text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
                    >
                      <Zap className="h-3 w-3" /> Buy Now
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(e, p.id)}
                      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/95 backdrop-blur shadow-md transition-all hover:scale-110 active:scale-95 ${addedId === p.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"}`}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                    {p.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">Out of stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-bold">{p.title}</h3>
                    <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{p.category} · {p.subcategory}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <span className="text-base font-extrabold gradient-text">${p.price}</span>
                        {p.old_price && <span className="ml-1 text-[10px] text-muted-foreground line-through">${p.old_price}</span>}
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--accent-orange)]">★ {p.rating}</span>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
