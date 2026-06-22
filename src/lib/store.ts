import { useSyncExternalStore, useRef } from "react";
import pChair from "../assets/p-chair.jpg";
import pCamera from "../assets/p-camera.jpg";
import pBoots from "../assets/p-boots.jpg";
import pRedchair from "../assets/p-redchair.jpg";
import pPineapple from "../assets/p-pineapple.jpg";
import pBands from "../assets/p-bands.jpg";
import pLaptop from "../assets/p-laptop.jpg";

export type Role = "user" | "delivery" | "admin";
export type User = {
  id: string; email: string; password: string; name: string; role: Role;
  phone?: string; altPhone?: string;
  address?: string; city?: string; zip?: string; location?: string;
  houseNo?: string; street?: string; state?: string; country?: string;
  avatar?: string;
  addresses?: SavedAddress[];
  payments?: PaymentMethod[];
  notifications?: { email: boolean; sms: boolean; promos: boolean };
  wishlist?: string[];
};
export type SavedAddress = { id: string; label: string; name: string; phone: string; line1: string; city: string; zip: string };
export type PaymentMethod = { id: string; brand: string; last4: string; holder: string; expiry: string };
export type Tag = "top" | "trending" | "best" | "near";
export type Review = { id: string; userId: string; userName: string; rating: number; comment: string; createdAt: number };
export type Product = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  subcategory: string;
  rating: number;
  description: string;
  tags: Tag[];
  stock: number;
  location: string;
  sellerId: string;
  reviews?: Review[];
  sold?: number;
  createdAt?: number;
};
export type CartItem = { productId: string; qty: number };
export type Address = { name: string; phone: string; line1: string; city: string; zip: string };
export type OrderStatus = "placed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
export type StatusEvent = { status: OrderStatus; at: number; by?: string; note?: string };
export type Order = {
  id: string;
  userId: string;
  items: { productId: string; title: string; price: number; qty: number; image: string }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  address: Address;
  payment: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: OrderStatus;
  createdAt: number;
  assignedTo?: string;
  history?: StatusEvent[];
  shipmentId?: string;
  transactionRef?: string;
};
export type Shipment = {
  shipmentId: string;
  orderId: string;
  courierPartner: string;
  trackingNumber: string;
  estimatedDeliveryDate: number;
  shipmentStatus: OrderStatus;
};
export type Notification = {
  id: string;
  userId: string;
  message: string;
  type: "order_placed" | "payment_success" | "shipped" | "out_for_delivery" | "delivered";
  orderId: string;
  createdAt: number;
  read: boolean;
};
// Temporary Buy Now session — survives navigation, cleared after order placed
export type BuyNowSession = { productId: string; qty: number; price: number };

export type State = {
  users: User[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  shipments: Shipment[];
  notifications: Notification[];
  currentUserId: string | null;
  theme: "light" | "dark";
  buyNowSession: BuyNowSession | null;
};

const KEY = "classiads_state_v6";


const P = (id: string, title: string, price: number, oldPrice: number, image: string, category: string, subcategory: string, rating: number, tags: Tag[], description: string, location = "Brooklyn, NY"): Product => ({
  id, title, price, oldPrice, image, category, subcategory, rating, tags, description, stock: 25, location, sellerId: "u3",
  sold: Math.floor(50 + Math.random() * 400),
  createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
  reviews: [],
});

const DEFAULT_PRODUCTS: Product[] = [
  P("p1", "Armchair Lounge", 190, 249, pChair, "home", "furniture", 4.5, ["top", "trending"], "Premium upholstered armchair with solid oak legs. Perfect for living rooms and reading nooks."),
  P("p2", "Professional DSLR Camera", 490, 649, pCamera, "electronics", "cameras", 4.8, ["top", "best"], "24.2MP DSLR with 18-55mm lens. Capture stunning photos and 4K video."),
  P("p3", "Casual Leather Shoes", 159, 249, pBoots, "fashion", "footwear", 4.5, ["trending", "near"], "Handcrafted full-grain leather casual shoes with cushioned insole."),
  P("p4", "Classic Vintage Chair", 299, 399, pRedchair, "home", "furniture", 4.6, ["best"], "Mid-century inspired accent chair in plush velvet upholstery."),
  P("p5", "Fresh Organic Pineapple", 40, 60, pPineapple, "food", "produce", 4.7, ["near"], "Sweet, juicy, locally grown organic pineapples — picked daily."),
  P("p6", "Exercise Resistance Bands", 59, 89, pBands, "sports", "equipment", 4.5, ["trending"], "Set of 5 latex bands with door anchor, handles, and carry bag."),
  P("p7", "TechPlus Gaming Laptop", 699, 899, pLaptop, "electronics", "laptops", 4.9, ["top", "best", "trending"], "15.6\" FHD 144Hz, RTX 4060, 16GB DDR5, 1TB NVMe SSD."),
  P("p8", "Modern Studio Chair", 220, 310, pChair, "home", "furniture", 4.4, ["near"], "Ergonomic studio chair with adjustable height and lumbar support."),
  P("p9", "Men's Cotton T-Shirt", 25, 39, pBoots, "fashion", "mens", 4.3, ["best"], "100% organic cotton crew-neck tee. Soft, breathable, durable."),
  P("p10", "Smartphone Pro Max", 999, 1199, pLaptop, "electronics", "mobiles", 4.8, ["top", "trending"], "Flagship phone with triple-camera, 120Hz OLED, all-day battery."),
  P("p11", "Vitamin D3 Supplements", 18, 26, pBands, "health", "vitamins", 4.6, ["best"], "Premium 5000 IU softgels, 180-day supply."),
  P("p12", "Designer Gold Watch", 349, 499, pCamera, "jewelry", "watches", 4.7, ["top"], "Stainless steel sapphire-crystal automatic watch."),
];

function load(): State {
  if (typeof window === "undefined") {
    return { users: [], products: DEFAULT_PRODUCTS, cart: [], orders: [], shipments: [], notifications: [], currentUserId: null, theme: "light", buyNowSession: null };
  }
  try {
    ["classiads_state", "classiads_state_v1", "classiads_state_v2", "classiads_state_v3", "classiads_state_v4", "classiads_state_v5"].forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as State;
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.products) || !parsed.products.length) parsed.products = DEFAULT_PRODUCTS;
    if (!Array.isArray(parsed.cart)) parsed.cart = [];
    if (!Array.isArray(parsed.orders)) parsed.orders = [];
    if (!Array.isArray(parsed.shipments)) parsed.shipments = [];
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
    if (!parsed.theme) parsed.theme = "light";
    parsed.buyNowSession = null; // never restore across sessions
    parsed.cart = parsed.cart.filter((c) => parsed.products.some((p) => p.id === c.productId));
    parsed.orders = parsed.orders.map((o) => {
      const fixed = o.history ? o : { ...o, history: [{ status: o.status, at: o.createdAt }] };
      if ((fixed as any)._cancelled) {
        return { ...fixed, status: "cancelled" as const, _cancelled: undefined };
      }
      // backfill missing financial fields for older stored orders
      if (!fixed.subtotal) {
        const sub = fixed.items.reduce((t, i) => t + i.price * i.qty, 0);
        return { ...fixed, subtotal: sub, tax: 0, shipping: 0, paymentStatus: "paid" as const };
      }
      return fixed;
    });
    return parsed;
  } catch {
    return { users: [], products: DEFAULT_PRODUCTS, cart: [], orders: [], shipments: [], notifications: [], currentUserId: null, theme: "light", buyNowSession: null };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  persist();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getState() {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const valueRef = useRef<T>(selector(state));
  return useSyncExternalStore(
    subscribe,
    () => {
      const next = selectorRef.current(state);
      if (shallowEqual(valueRef.current, next)) return valueRef.current;
      valueRef.current = next;
      return next;
    },
    () => selectorRef.current(state),
  );
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!Object.is((a as any)[k], (b as any)[k])) return false;
    return true;
  }
  return false;
}

// ---------- Admin: Delivery Agent Management ----------
export function createDeliveryAgent(name: string, email: string, password: string, phone: string): { user: User } | { error: string } {
  const exists = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { error: "An account with this email already exists." };
  const user: User = {
    id: "d_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8),
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    role: "delivery",
    phone: phone.trim(),
  };
  setState((s) => ({ ...s, users: [...s.users, user] }));
  return { user };
}
export function deleteDeliveryAgent(id: string) {
  setState((s) => ({
    ...s,
    users: s.users.filter((u) => !(u.id === id && u.role === "delivery")),
  }));
}
export function adminResetDeliveryPassword(agentId: string, newPassword: string) {
  setState((s) => ({
    ...s,
    users: s.users.map((u) =>
      u.id === agentId && u.role === "delivery" ? { ...u, password: newPassword } : u
    ),
  }));
}

// ---------- Auth ----------
export function register(name: string, email: string, password: string): { user: User } | { error: string } {
  const exists = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { error: "An account with this email already exists." };
  const user: User = {
    id: "u_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8),
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    role: "user",
  };
  setState((s) => ({ ...s, users: [...s.users, user], currentUserId: user.id }));
  return { user };
}
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // still iterate to avoid length-based timing leak
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function login(email: string, password: string): User | null {
  const u = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!u || !timingSafeEqual(u.password, password)) return null;
  setState((s) => ({ ...s, currentUserId: u.id }));
  return u;
}
export function logout() {
  setState((s) => ({ ...s, currentUserId: null }));
}
export function currentUser(s = state): User | null {
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

// ---------- Cart ----------
export function addToCart(productId: string, qty = 1) {
  setState((s) => {
    const existing = s.cart.find((c) => c.productId === productId);
    const cart = existing
      ? s.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c))
      : [...s.cart, { productId, qty }];
    return { ...s, cart };
  });
}
export function setQty(productId: string, qty: number) {
  setState((s) => ({
    ...s,
    cart: qty <= 0 ? s.cart.filter((c) => c.productId !== productId) : s.cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
  }));
}
export function removeFromCart(productId: string) {
  setState((s) => ({ ...s, cart: s.cart.filter((c) => c.productId !== productId) }));
}
export function clearCart() {
  setState((s) => ({ ...s, cart: [] }));
}

// ---------- Buy Now ----------
export function setBuyNow(session: BuyNowSession) {
  setState((s) => ({ ...s, buyNowSession: session }));
}
export function clearBuyNow() {
  setState((s) => ({ ...s, buyNowSession: null }));
}

// ---------- Orders ----------
export function placeOrder(
  address: Address,
  payment: string,
  buyNow?: BuyNowSession | null,
  transactionRef?: string,
): Order | null {
  const s = state;
  const user = currentUser(s);
  if (!user) return null;

  let items: Order["items"];
  if (buyNow) {
    const p = s.products.find((x) => x.id === buyNow.productId);
    if (!p || p.stock < buyNow.qty) return null;
    items = [{ productId: p.id, title: p.title, price: buyNow.price, qty: buyNow.qty, image: p.image }];
  } else {
    items = s.cart
      .map((c) => {
        const p = s.products.find((p) => p.id === c.productId);
        if (!p) return null;
        return { productId: p.id, title: p.title, price: p.price, qty: c.qty, image: p.image };
      })
      .filter(Boolean) as Order["items"];
  }
  if (!items.length) return null;

  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  const now = Date.now();
  const orderId = "ord_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const shipmentId = "shp_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const trackingNumber = "TRK" + Math.random().toString(36).slice(2, 10).toUpperCase();

  const order: Order = {
    id: orderId,
    userId: user.id,
    items,
    subtotal,
    tax,
    shipping,
    total,
    address,
    payment,
    paymentStatus: "paid",
    status: "placed",
    createdAt: now,
    history: [{ status: "placed", at: now }],
    shipmentId,
    transactionRef: transactionRef ?? "txn_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12),
  };

  const shipment: Shipment = {
    shipmentId,
    orderId,
    courierPartner: "ClassiShip Express",
    trackingNumber,
    estimatedDeliveryDate: now + 5 * 24 * 60 * 60 * 1000,
    shipmentStatus: "placed",
  };

  const notification: Notification = {
    id: "n_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8),
    userId: user.id,
    message: `Order ${orderId} placed successfully!`,
    type: "order_placed",
    orderId,
    createdAt: now,
    read: false,
  };

  setState((s) => ({
    ...s,
    orders: [order, ...s.orders],
    shipments: [shipment, ...s.shipments],
    notifications: [notification, ...s.notifications],
    cart: buyNow ? s.cart : [],
    buyNowSession: null,
    // reduce stock
    products: s.products.map((p) => {
      const ordered = items.find((i) => i.productId === p.id);
      if (!ordered) return p;
      return { ...p, stock: Math.max(0, p.stock - ordered.qty) };
    }),
  }));
  return order;
}
export function advanceOrder(orderId: string, status: OrderStatus, deliveryUserId?: string, note?: string) {
  const now = Date.now();
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return s;
    const history = [...(order.history ?? []), { status, at: now, by: deliveryUserId, note }];
    const updatedOrder = { ...order, status, assignedTo: deliveryUserId ?? order.assignedTo, history };

    // sync shipment status
    const updatedShipments = s.shipments.map((sh) =>
      sh.orderId === orderId ? { ...sh, shipmentStatus: status } : sh
    );

    // restore stock on cancellation
    let updatedProducts = s.products;
    if (status === "cancelled") {
      updatedProducts = s.products.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock + item.qty };
      });
    }

    // add notification for status milestones
    let newNotification: Notification | null = null;
    const notifMap: Partial<Record<OrderStatus, Notification["type"]>> = {
      shipped: "shipped",
      out_for_delivery: "out_for_delivery",
      delivered: "delivered",
    };
    const notifType = notifMap[status];
    if (notifType && order.userId) {
      const msgMap: Record<string, string> = {
        shipped: `Your order ${orderId} has been shipped!`,
        out_for_delivery: `Your order ${orderId} is out for delivery!`,
        delivered: `Your order ${orderId} has been delivered!`,
      };
      newNotification = {
        id: "n_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8),
        userId: order.userId,
        message: msgMap[status],
        type: notifType,
        orderId,
        createdAt: now,
        read: false,
      };
    }

    return {
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      shipments: updatedShipments,
      products: updatedProducts,
      notifications: newNotification ? [newNotification, ...s.notifications] : s.notifications,
    };
  });
}

// ---------- Admin / Products ----------
export function upsertProduct(p: Product) {
  setState((s) => {
    const exists = s.products.some((x) => x.id === p.id);
    return { ...s, products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] };
  });
}
export function deleteProduct(id: string) {
  setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
}
export function newProductId() {
  return "p_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

// ---------- Profile ----------
export function updateUser(patch: Partial<User>) {
  setState((s) => {
    if (!s.currentUserId) return s;
    return { ...s, users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, ...patch } : u)) };
  });
}

export function addAddress(a: Omit<SavedAddress, "id">) {
  const id = "ad_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  setState((s) => {
    if (!s.currentUserId) return s;
    return {
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId ? { ...u, addresses: [...(u.addresses ?? []), { ...a, id }] } : u,
      ),
    };
  });
}
export function removeAddress(id: string) {
  setState((s) => {
    if (!s.currentUserId) return s;
    return {
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId ? { ...u, addresses: (u.addresses ?? []).filter((x) => x.id !== id) } : u,
      ),
    };
  });
}
export function addPayment(p: Omit<PaymentMethod, "id">) {
  const id = "pm_" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  setState((s) => {
    if (!s.currentUserId) return s;
    return {
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId ? { ...u, payments: [...(u.payments ?? []), { ...p, id }] } : u,
      ),
    };
  });
}
export function removePayment(id: string) {
  setState((s) => {
    if (!s.currentUserId) return s;
    return {
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId ? { ...u, payments: (u.payments ?? []).filter((x) => x.id !== id) } : u,
      ),
    };
  });
}
export function changePassword(current: string, next: string): boolean {
  const s = state;
  const u = currentUser(s);
  if (!u || !timingSafeEqual(u.password, current)) return false;
  setState((s) => ({
    ...s,
    users: s.users.map((x) => (x.id === u.id ? { ...x, password: next } : x)),
  }));
  return true;
}

// ---------- Orders ---------- (cancel)
export function cancelOrder(orderId: string) {
  setState((s) => {
    const order = s.orders.find((o) => o.id === orderId && o.userId === s.currentUserId);
    if (!order || (order.status !== "placed" && order.status !== "packed")) return s;
    const history = [...(order.history ?? []), { status: "cancelled" as OrderStatus, at: Date.now(), note: "Cancelled by customer" }];
    const updatedOrder = { ...order, status: "cancelled" as OrderStatus, assignedTo: undefined, history };
    // restore stock
    const restoredProducts = s.products.map((p) => {
      const item = order.items.find((i) => i.productId === p.id);
      if (!item) return p;
      return { ...p, stock: p.stock + item.qty };
    });
    return {
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      products: restoredProducts,
      shipments: s.shipments.map((sh) =>
        sh.orderId === orderId ? { ...sh, shipmentStatus: "cancelled" as OrderStatus } : sh
      ),
    };
  });
}

// ---------- Reviews ----------
export function addReview(productId: string, rating: number, comment: string) {
  setState((s) => {
    const u = s.users.find((x) => x.id === s.currentUserId);
    if (!u) return s;
    const product = s.products.find((p) => p.id === productId);
    if (!product) return s;
    // Prevent duplicate review from same user
    const alreadyReviewed = (product.reviews ?? []).some((r) => r.userId === u.id);
    if (alreadyReviewed) return s;
    const review: Review = { id: crypto.randomUUID(), userId: u.id, userName: u.name, rating, comment, createdAt: Date.now() };
    return {
      ...s,
      products: s.products.map((p) => (p.id === productId ? { ...p, reviews: [review, ...(p.reviews ?? [])] } : p)),
    };
  });
}

// ---------- Wishlist ----------
export function toggleWishlist(productId: string) {
  setState((s) => {
    if (!s.currentUserId) return s;
    return {
      ...s,
      users: s.users.map((u) => {
        if (u.id !== s.currentUserId) return u;
        const wl = u.wishlist ?? [];
        const next = wl.includes(productId) ? wl.filter((x) => x !== productId) : [...wl, productId];
        return { ...u, wishlist: next };
      }),
    };
  });
}

// ---------- Theme ----------
export function toggleTheme() {
  setState((s) => {
    const next = s.theme === "light" ? "dark" : "light";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
    return { ...s, theme: next };
  });
}
export function applyTheme(theme: "light" | "dark") {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

export function getShipment(orderId: string): Shipment | null {
  return state.shipments.find((s) => s.orderId === orderId) ?? null;
}

export function markNotificationsRead(userId: string) {
  setState((s) => ({
    ...s,
    notifications: s.notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    ),
  }));
}

export const ORDER_STAGES: OrderStatus[] = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];
export const ORDER_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};