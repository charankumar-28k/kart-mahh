import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
  type ReactNode,
} from "react";
import * as api from "./api";
import type { Database } from "./database.types";
import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type Profile       = Database["public"]["Tables"]["profiles"]["Row"];
type Product       = Database["public"]["Tables"]["products"]["Row"] & { reviews?: Review[] };
type Review        = Database["public"]["Tables"]["reviews"]["Row"];
type Order         = any; // using any to avoid field mismatch issues with RPC returns
type Notification  = Database["public"]["Tables"]["notifications"]["Row"];
type SavedAddress  = Database["public"]["Tables"]["saved_addresses"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

// ─── Store interface ─────────────────────────────────────────────────────────
interface StoreState {
  user: Profile | null;
  products: Product[];
  orders: Order[];
  availableOrders: Order[];
  notifications: Notification[];
  savedAddresses: SavedAddress[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Parameters<typeof api.updateProfile>[1]) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  addAddress: (a: Omit<SavedAddress, "id" | "user_id" | "created_at">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  addPayment: (p: Omit<PaymentMethod, "id" | "user_id" | "created_at">) => Promise<void>;
  removePayment: (id: string) => Promise<void>;
  refreshProducts: (filters?: Parameters<typeof api.getProducts>[0]) => Promise<void>;
  upsertProduct: (p: Parameters<typeof api.upsertProduct>[0]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  placeOrder: (args: Parameters<typeof api.placeOrder>[0]) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<void>;
  advanceOrder: (orderId: string, status: Parameters<typeof api.advanceOrder>[1], agentId?: string, note?: string) => Promise<void>;
  claimOrder: (orderId: string) => Promise<void>;
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const StoreContext = createContext<StoreState | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function SupabaseStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable refs — always hold latest values without causing re-renders
  const userRef = useRef<Profile | null>(null);
  const initializedRef = useRef(false);

  // ── Fetch orders for any role ───────────────────────────────────────────────
  const fetchOrders = useCallback(async (u: Profile) => {
    try {
      if (u.role === "admin") {
        const all = await api.getAllOrders();
        setOrders(all ?? []);
        setAvailableOrders([]);
      } else if (u.role === "delivery") {
        const [mine, available] = await Promise.all([
          api.getMyDeliveries(u.id),
          api.getAvailableOrders(),
        ]);
        setOrders(mine ?? []);
        setAvailableOrders(available ?? []);
      } else {
        const mine = await api.getOrders(u.id);
        setOrders(mine ?? []);
        setAvailableOrders([]);
      }
    } catch (e) {
      console.error("fetchOrders failed:", e);
    }
  }, []);

  // ── Bootstrap: called once after login or page load ─────────────────────────
  const bootstrap = useCallback(async (userId: string) => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setLoading(true);
    try {
      // 1. Ensure profile row exists
      const { data: authUser } = await supabase.auth.getUser();
      const email = authUser.user?.email ?? "";
      const name = authUser.user?.user_metadata?.name ?? email.split("@")[0] ?? "User";
      await (supabase as any)
        .from("profiles")
        .upsert({ id: userId, email, name, role: "user" }, { onConflict: "id", ignoreDuplicates: true });

      // 2. Load profile
      const profile = await api.getProfile(userId);
      const p = profile as Profile;
      setUser(p);
      userRef.current = p;

      // 3. Load everything in parallel
      await Promise.all([
        fetchOrders(p),
        api.getNotifications(userId).then((n) => setNotifications(n as Notification[])).catch(() => {}),
        api.getSavedAddresses(userId).then((a) => setSavedAddresses(a as SavedAddress[])).catch(() => {}),
        api.getPaymentMethods(userId).then((pm) => setPaymentMethods(pm as PaymentMethod[])).catch(() => {}),
      ]);
    } catch (err) {
      console.error("bootstrap error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  // ── Keep userRef in sync with state ────────────────────────────────────────
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Auth listener + initial session check ──────────────────────────────────
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        bootstrap(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for sign-in / sign-out
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !initializedRef.current) {
        bootstrap(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setOrders([]);
        setAvailableOrders([]);
        setNotifications([]);
        setSavedAddresses([]);
        setPaymentMethods([]);
        setLoading(false);
        initializedRef.current = false;
        userRef.current = null;
      }
    });

    // Load products (public, no auth needed)
    api.getProducts().then((p) => setProducts(p as Product[])).catch(() => {});

    return () => listener.subscription.unsubscribe();
  }, [bootstrap]);

  // ── Polling: refresh orders every 5 seconds ─────────────────────────────────
  // This guarantees admin/delivery see new orders without depending on Realtime
  useEffect(() => {
    const interval = setInterval(() => {
      const u = userRef.current;
      if (u) fetchOrders(u);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Realtime: instant push on top of polling ────────────────────────────────
  useEffect(() => {
    const u = userRef.current;
    if (!u) return; // don't subscribe if not logged in

    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        const cur = userRef.current;
        if (cur) fetchOrders(cur);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_history" }, () => {
        const cur = userRef.current;
        if (cur) fetchOrders(cur);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const cur = userRef.current;
        if (cur && (payload.new as any)?.user_id === cur.id) {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        api.getProducts().then((p) => setProducts(p as Product[])).catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, user]); // re-subscribe when user changes

  // ── Auth ───────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    initializedRef.current = false; // allow re-bootstrap
    const authUser = await api.signIn(email, password);
    if (authUser) await bootstrap(authUser.id);
  }, [bootstrap]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await api.signUp(name, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
  }, []);

  // ── Profile ────────────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (patch: Parameters<typeof api.updateProfile>[1]) => {
    if (!userRef.current) return;
    const updated = await api.updateProfile(userRef.current.id, patch);
    setUser(updated as Profile);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    await api.changePassword(newPassword);
  }, []);

  // ── Addresses ──────────────────────────────────────────────────────────────
  const addAddress = useCallback(async (a: Omit<SavedAddress, "id" | "user_id" | "created_at">) => {
    if (!userRef.current) return;
    const created = await api.addSavedAddress(userRef.current.id, a);
    setSavedAddresses((prev) => [...prev, created as SavedAddress]);
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    await api.deleteSavedAddress(id);
    setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Payments ───────────────────────────────────────────────────────────────
  const addPayment = useCallback(async (p: Omit<PaymentMethod, "id" | "user_id" | "created_at">) => {
    if (!userRef.current) return;
    const created = await api.addPaymentMethod(userRef.current.id, p);
    setPaymentMethods((prev) => [...prev, created as PaymentMethod]);
  }, []);

  const removePayment = useCallback(async (id: string) => {
    await api.deletePaymentMethod(id);
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Products ───────────────────────────────────────────────────────────────
  const refreshProducts = useCallback(async (filters?: Parameters<typeof api.getProducts>[0]) => {
    const data = await api.getProducts(filters);
    setProducts(data as Product[]);
  }, []);

  const upsertProduct = useCallback(async (p: Parameters<typeof api.upsertProduct>[0]) => {
    const saved = await api.upsertProduct(p);
    const savedAny = saved as any;
    setProducts((prev) => {
      const exists = prev.some((x) => (x as any).id === savedAny.id);
      return exists
        ? prev.map((x) => ((x as any).id === savedAny.id ? { ...(x as any), ...savedAny } : x))
        : [savedAny, ...prev];
    });
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p: any) => p.id !== id));
  }, []);

  // ── Orders ─────────────────────────────────────────────────────────────────
  const refreshOrders = useCallback(async () => {
    const u = userRef.current;
    if (u) await fetchOrders(u);
  }, [fetchOrders]);

  const placeOrder = useCallback(async (args: Parameters<typeof api.placeOrder>[0]) => {
    const orderId = await api.placeOrder(args);
    // Immediately refresh for the placing user
    const u = userRef.current;
    if (u) {
      const [updated, notifs] = await Promise.all([
        api.getOrders(u.id),
        api.getNotifications(u.id),
      ]);
      setOrders(updated ?? []);
      setNotifications(notifs as Notification[]);
    }
    return orderId;
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    await api.cancelOrder(orderId, "customer");
    const u = userRef.current;
    if (u) await fetchOrders(u);
  }, [fetchOrders]);

  const advanceOrder = useCallback(async (
    orderId: string,
    status: Parameters<typeof api.advanceOrder>[1],
    agentId?: string,
    note?: string,
  ) => {
    await api.advanceOrder(orderId, status, agentId, note);
    const u = userRef.current;
    if (u) await fetchOrders(u);
  }, [fetchOrders]);

  const claimOrder = useCallback(async (orderId: string) => {
    const u = userRef.current;
    if (!u || u.role !== "delivery") return;
    await api.claimOrder(orderId, u.id);
    await fetchOrders(u);
  }, [fetchOrders]);

  // ── Reviews ────────────────────────────────────────────────────────────────
  const addReview = useCallback(async (productId: string, rating: number, comment: string) => {
    if (!userRef.current) return;
    await api.addReview(productId, userRef.current.id, userRef.current.name, rating, comment);
    await refreshProducts();
  }, [refreshProducts]);

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const toggleWishlist = useCallback(async (productId: string) => {
    if (!userRef.current) return;
    const updated = await api.toggleWishlist(userRef.current.id, productId);
    setUser((prev) => prev ? { ...prev, wishlist: updated } : prev);
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────
  const markNotificationsRead = useCallback(async () => {
    if (!userRef.current) return;
    await api.markNotificationsRead(userRef.current.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <StoreContext.Provider value={{
      user, products, orders, availableOrders, notifications,
      savedAddresses, paymentMethods, loading,
      signIn, signUp, signOut,
      updateProfile, changePassword,
      addAddress, removeAddress,
      addPayment, removePayment,
      refreshProducts, upsertProduct, deleteProduct,
      placeOrder, cancelOrder, advanceOrder, claimOrder,
      addReview, toggleWishlist, markNotificationsRead,
      refreshOrders,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useSupabaseStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSupabaseStore must be used inside SupabaseStoreProvider");
  return ctx;
}

export function useCurrentUser() { return useSupabaseStore().user; }
export function useProducts(filter?: (p: Product) => boolean) {
  const { products } = useSupabaseStore();
  return filter ? products.filter(filter) : products;
}
export function useOrders() { return useSupabaseStore().orders; }
export function useUnreadCount() {
  const { notifications } = useSupabaseStore();
  return notifications.filter((n) => !n.read).length;
}
