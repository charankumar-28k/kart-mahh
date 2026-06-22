import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "./SiteLayout";

export function ProfileSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-5 py-10">
        <Link to="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-3 w-3" /> Back to profile
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight animate-fade-up" style={{ fontFamily: "'Sora', sans-serif" }}>
          {title.split(" ")[0]} <span className="gradient-text">{title.split(" ").slice(1).join(" ")}</span>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground animate-fade-up">{subtitle}</p>}
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {children}
        </div>
      </div>
    </PageShell>
  );
}

export const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:shadow-[var(--shadow-soft)] disabled:opacity-60";