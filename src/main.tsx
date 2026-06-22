import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { applyTheme, getTheme } from "./lib/cart-store";
import { SupabaseStoreProvider } from "./lib/supabase-store.tsx";
import "./styles.css";

applyTheme(getTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SupabaseStoreProvider>
      <RouterProvider router={router} />
    </SupabaseStoreProvider>
  </StrictMode>,
);
