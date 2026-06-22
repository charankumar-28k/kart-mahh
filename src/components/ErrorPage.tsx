import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw, SearchX } from "lucide-react";
import type { ReactNode } from "react";

type ActionProps = {
  onRetry?: () => void;
  homeTo?: "/" | "/products";
};

function ErrorActions({ onRetry, homeTo = "/" }: ActionProps) {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full [background:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
      <Link
        to={homeTo}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Home className="h-4 w-4" />
        Go home
      </Link>
    </div>
  );
}

type StatusPageProps = {
  icon: ReactNode;
  code?: string;
  title: string;
  description: string;
  onRetry?: () => void;
  homeTo?: "/" | "/products";
};

function StatusPage({ icon, code, title, description, onRetry, homeTo }: StatusPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center animate-fade-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl [background:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-glow)]">
          {icon}
        </div>
        {code && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Error {code}
          </p>
        )}
        <h1
          className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <ErrorActions onRetry={onRetry} homeTo={homeTo} />
      </div>
    </div>
  );
}

export function NotFoundPage({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or may have been moved.",
  code = "404",
  homeTo = "/",
}: {
  title?: string;
  description?: string;
  code?: string;
  homeTo?: "/" | "/products";
}) {
  return (
    <StatusPage
      icon={<SearchX className="h-8 w-8" />}
      code={code}
      title={title}
      description={description}
      homeTo={homeTo}
    />
  );
}

export function ErrorPageView({
  title = "This page didn't load",
  description = "Something went wrong on our end. Try refreshing or head back home.",
  code,
  onRetry,
}: {
  title?: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
}) {
  return (
    <StatusPage
      icon={<AlertTriangle className="h-8 w-8" />}
      code={code}
      title={title}
      description={description}
      onRetry={onRetry}
    />
  );
}
