/**
 * cart-store.ts — localStorage cart (not in Supabase schema)
 */
import { useSyncExternalStore } from "react";

export type CartItem = { productId: string; qty: number };

const KEY = "classiads_cart_v1";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

let cart: CartItem[] = typeof window !== "undefined" ? load() : [];
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cart));
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getCart() { return cart; }

export function useCart() {
  return useSyncExternalStore(subscribe, getCart, () => []);
}

export function addToCart(productId: string, qty = 1) {
  const existing = cart.find((c) => c.productId === productId);
  cart = existing
    ? cart.map((c) => c.productId === productId ? { ...c, qty: c.qty + qty } : c)
    : [...cart, { productId, qty }];
  persist();
}

export function setQty(productId: string, qty: number) {
  cart = qty <= 0 ? cart.filter((c) => c.productId !== productId) : cart.map((c) => c.productId === productId ? { ...c, qty } : c);
  persist();
}

export function removeFromCart(productId: string) {
  cart = cart.filter((c) => c.productId !== productId);
  persist();
}

export function clearCart() {
  cart = [];
  persist();
}

export type BuyNowSession = { productId: string; qty: number; price: number };
let buyNow: BuyNowSession | null = null;
export function setBuyNow(s: BuyNowSession) { buyNow = s; }
export function getBuyNow() { return buyNow; }
export function clearBuyNow() { buyNow = null; }

// Theme
const THEME_KEY = "classiads_theme";
export function getTheme(): "light" | "dark" {
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") ?? "light";
}
export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
export function toggleTheme() {
  const next = getTheme() === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}
