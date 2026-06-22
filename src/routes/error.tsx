import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { PageShell } from "../components/SiteLayout";

type ErrorSearch = { code?: string; message?: string };

export const Route = createFileRoute("/error")({
  validateSearch: (search: Record<string, unknown>): ErrorSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
    message: typeof search.message === "string" ? search.message : undefined,
  }),
  component: ErrorRoutePage,
});

function ErrorRoutePage() {
  const { code, message } = Route.useSearch();
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-5 py-24 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        {code && <p className="text-sm font-mono text-muted-foreground mb-2">Error {code}</p>}
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message ?? "We couldn't complete your request. Please try again or return to the homepage."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => window.history.back()}
            className="rounded-full [background:var(--gradient-brand)] px-6 py-3 text-sm font-semibold text-primary-foreground hover:scale-105 transition-transform">
            Go back
          </button>
          <Link to="/" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary transition-colors">
            Home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
