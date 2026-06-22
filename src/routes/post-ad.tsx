import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { CategoryPicker } from "../components/CategoryPicker";
import { PageShell } from "../components/SiteLayout";
import { useSupabaseStore } from "../lib/supabase-store";

export const Route = createFileRoute("/post-ad")({ component: PostAdPage });

function PostAdPage() {
  const navigate = useNavigate();
  const { user, upsertProduct } = useSupabaseStore();

  const [form, setForm] = useState({
    title: "",
    price: "",
    oldPrice: "",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    category: "fashion",
    subcategory: "mens",
    description: "",
    location: "Brooklyn, NY",
    stock: "10",
    rating: "4.5",
  });

  if (!user || user.role !== "admin") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-5 py-20 text-center animate-fade-up">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Only admin accounts can list new products.</p>
          <Link to="/login" className="mt-6 inline-block rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">Sign in as admin</Link>
        </div>
      </PageShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    await upsertProduct({
      id,
      title: form.title,
      price: Number(form.price),
      old_price: form.oldPrice ? Number(form.oldPrice) : undefined,
      image: form.image,
      category: form.category,
      subcategory: form.subcategory,
      rating: Number(form.rating) || 4.5,
      description: form.description,
      tags: ["near"],
      stock: Number(form.stock) || 10,
      location: form.location,
      seller_id: user.id,
    });
    navigate({ to: "/product/$id", params: { id } });
  };

  const input = "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:shadow-[var(--shadow-soft)]";

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Sell something today
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Post your <span className="gradient-text">ad</span>
          </h1>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 animate-fade-up">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Like-new gaming chair" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Price ($)</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="99" className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Original price (optional)</label>
              <input type="number" min="0" step="0.01" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="149" className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CategoryPicker
              category={form.category}
              subcategory={form.subcategory}
              onCategoryChange={(category, subcategory) => setForm({ ...form, category, subcategory })}
              onSubcategoryChange={(subcategory) => setForm({ ...form, subcategory })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Image URL</label>
            <input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className={input} />
            {form.image && <img src={form.image} alt="" className="mt-3 h-32 w-32 rounded-xl object-cover border border-border animate-scale-pop" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Stock quantity</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Rating (0–5)</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={input} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about the condition, features, and reason for selling..." className={input + " resize-none"} />
          </div>
          <button type="submit" className="group relative w-full overflow-hidden rounded-xl [background:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:scale-[1.02] active:scale-95 transition-transform">
            Publish ad
            <span className="pointer-events-none absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
          </button>
        </form>
      </div>
    </PageShell>
  );
}