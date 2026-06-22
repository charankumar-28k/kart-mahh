export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ClassiAds — Something went wrong</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { --brand-start: #6366f1; --brand-end: #ec4899; }
      * { box-sizing: border-box; }
      body {
        font: 15px/1.6 system-ui, -apple-system, sans-serif;
        background: #0a0a0b;
        color: #fafafa;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
      }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .icon {
        width: 4rem; height: 4rem; margin: 0 auto 1.5rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, var(--brand-start), var(--brand-end));
        display: grid; place-items: center;
        font-size: 1.75rem;
      }
      h1 { font: 800 1.75rem/1.2 system-ui, sans-serif; margin: 0 0 0.75rem; }
      p { color: #a1a1aa; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: 0.625rem 1.25rem; border-radius: 9999px; font: 600 0.875rem inherit;
        cursor: pointer; text-decoration: none; border: 1px solid transparent;
      }
      .primary { background: linear-gradient(135deg, var(--brand-start), var(--brand-end)); color: #fff; }
      .secondary { background: #18181b; color: #fafafa; border-color: #3f3f46; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon" aria-hidden="true">⚠</div>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
