import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MapPin, ChevronLeft, Filter } from "lucide-react";
import { NotFoundPage } from "../components/ErrorPage";
import { PageShell } from "../components/SiteLayout";
import { CATEGORIES, findCategory } from "../lib/categories";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = useParams({ from: "/category/$slug" });
  const cat = findCategory(slug);
  const products = useStore((s) => s.products);
  const [sub, setSub] = useState<string>("all");

  const list = useMemo(() => {
    if (!cat) return [];
    return products.filter((p) => p.category === cat.slug && (sub === "all" || p.subcategory === sub));
  }, [products, cat, sub]);

  if (!cat) {
    return (
      <PageShell>
        <NotFoundPage title="Category not found" description="We couldn't find that category. Browse the shop to discover more." homeTo="/products" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 [background:var(--gradient-hero)] opacity-60" />
        <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 [background:var(--gradient-brand)] opacity-30 animate-blob blur-2xl" />
        <div className="relative mx-auto max-w-7xl px-5 pt-10 pb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-3 w-3" /> All categories
          </Link>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight animate-fade-up" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="mr-3">{cat.emoji}</span>
            <span className="gradient-text">{cat.label}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground animate-fade-up">{list.length} items in this category</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar — subcategories */}
        <aside className="rounded-2xl border border-border bg-card p-4 h-fit sticky top-24 animate-fade-up">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Filter className="h-3 w-3" /> Subcategories
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={() => setSub("all")}
              className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${sub === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              All {cat.label}
            </button>
            {cat.subs.map((s) => (
              <button
                key={s.slug}
                onClick={() => setSub(s.slug)}
                className={`block w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${sub === s.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">All categories</div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setSub("all")}
                  className={`block rounded-lg px-2 py-1.5 text-xs hover:bg-secondary ${c.slug === cat.slug ? "font-bold text-primary" : "text-muted-foreground"}`}
                >
                  {c.emoji} {c.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center animate-fade-up">
              <p className="text-muted-foreground">No products yet in this section.</p>
              <Link to="/post-ad" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                Be the first to post one →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {list.map((p, i) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card animate-fade-up hover-lift block"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-bold">{p.title}</h3>
                    <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{p.subcategory}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-base font-extrabold gradient-text">${p.price}</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </span>
                    </div>
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