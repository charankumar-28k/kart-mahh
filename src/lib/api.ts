/**
 * api.ts — Full Supabase backend API for ClassiAds
 */
import { supabase } from "./supabase";
import type { OrderStatus, NotificationType } from "./database.types";

// Typed shorthand — casts the entire client to any so TS never infers never[]
// on chained insert/update/upsert calls with complex union types.
const db = supabase as any;

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: "user" } },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(cb);
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data as {
    id: string; email: string; name: string; role: string;
    phone: string | null; alt_phone: string | null; address: string | null;
    house_no: string | null; street: string | null; city: string | null;
    state: string | null; country: string | null; zip: string | null;
    location: string | null; avatar: string | null; wishlist: string[];
    created_at: string; updated_at: string;
  };
}

export async function updateProfile(userId: string, patch: {
  name?: string; phone?: string; alt_phone?: string;
  house_no?: string; street?: string; city?: string;
  state?: string; country?: string; zip?: string;
  address?: string; location?: string; avatar?: string;
}) {
  const { data, error } = await db.from("profiles").update(patch).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getAllProfiles() {
  const { data, error } = await db.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function getDeliveryAgents() {
  const { data, error } = await db.from("profiles").select("*").eq("role", "delivery");
  if (error) throw error;
  return data as any[];
}

export async function createDeliveryAgent(name: string, email: string, password: string, phone: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: "delivery" } },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Failed to create agent account.");
  const { error: profileErr } = await db
    .from("profiles")
    .update({ role: "delivery", phone })
    .eq("id", data.user.id);
  if (profileErr) throw profileErr;
  return data.user.id;
}

export async function deleteDeliveryAgent(agentId: string) {
  const { error } = await db.from("profiles").delete().eq("id", agentId).eq("role", "delivery");
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SAVED ADDRESSES
// ─────────────────────────────────────────────────────────────

export async function getSavedAddresses(userId: string) {
  const { data, error } = await db
    .from("saved_addresses").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data as any[];
}

export async function addSavedAddress(userId: string, addr: {
  label: string; name: string; phone: string; line1: string; city: string; zip: string;
}) {
  const { data, error } = await db
    .from("saved_addresses").insert({ ...addr, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSavedAddress(id: string) {
  const { error } = await db.from("saved_addresses").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────────────────────

export async function getPaymentMethods(userId: string) {
  const { data, error } = await db
    .from("payment_methods").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data as any[];
}

export async function addPaymentMethod(userId: string, pm: {
  brand: string; last4: string; holder: string; expiry: string;
}) {
  const { data, error } = await db
    .from("payment_methods").insert({ ...pm, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function deletePaymentMethod(id: string) {
  const { error } = await db.from("payment_methods").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────

export async function getProducts(filters?: {
  category?: string; subcategory?: string; search?: string;
  tags?: string[]; sort?: "price_asc" | "price_desc" | "rating" | "newest";
}) {
  let query = db.from("products").select("*, reviews(*)");

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.subcategory) query = query.eq("subcategory", filters.subcategory);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters?.tags?.length) query = query.overlaps("tags", filters.tags);

  if (filters?.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters?.sort === "price_desc") query = query.order("price", { ascending: false });
  else if (filters?.sort === "rating") query = query.order("rating", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getProductById(id: string) {
  const { data, error } = await db.from("products").select("*, reviews(*)").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function upsertProduct(product: {
  id?: string; title: string; price: number; old_price?: number;
  image: string; category: string; subcategory: string; rating: number;
  description: string; tags: string[]; stock: number; location: string; seller_id: string;
}) {
  const { data, error } = await db.from("products").upsert(product).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProductStock(id: string, delta: number) {
  const { data: product, error: fetchErr } = await db.from("products").select("stock").eq("id", id).single();
  if (fetchErr) throw fetchErr;
  const { error } = await db
    .from("products")
    .update({ stock: Math.max(0, ((product as any)?.stock ?? 0) + delta) })
    .eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function getReviews(productId: string) {
  const { data, error } = await db
    .from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
  if (error) throw error;
  return data as any[];
}

export async function addReview(productId: string, userId: string, userName: string, rating: number, comment: string) {
  const { data, error } = await db
    .from("reviews")
    .insert({ product_id: productId, user_id: userId, user_name: userName, rating, comment })
    .select().single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────

export async function getWishlist(userId: string): Promise<string[]> {
  const { data, error } = await db.from("profiles").select("wishlist").eq("id", userId).single();
  if (error) throw error;
  return (data as any).wishlist ?? [];
}

export async function toggleWishlist(userId: string, productId: string) {
  const current = await getWishlist(userId);
  const updated = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  const { error } = await db.from("profiles").update({ wishlist: updated }).eq("id", userId);
  if (error) throw error;
  return updated;
}

// ─────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────

export async function placeOrder(order: {
  id: string;
  userId: string;
  items: { productId: string; title: string; price: number; qty: number; image: string }[];
  subtotal: number; tax: number; shipping: number; total: number;
  address: { name: string; phone: string; line1: string; city: string; zip: string };
  payment: string;
  shipmentId: string;
  transactionRef: string;
}) {
  const { error: orderErr } = await db.from("orders").insert({
    id: order.id,
    user_id: order.userId,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    address_name: order.address.name,
    address_phone: order.address.phone,
    address_line1: order.address.line1,
    address_city: order.address.city,
    address_zip: order.address.zip,
    payment: order.payment,
    payment_status: "paid",
    status: "placed",
    shipment_id: order.shipmentId,
    transaction_ref: order.transactionRef,
  });
  if (orderErr) throw orderErr;

  const { error: itemsErr } = await db.from("order_items").insert(
    order.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      title: i.title,
      price: i.price,
      qty: i.qty,
      image: i.image,
    }))
  );
  if (itemsErr) throw itemsErr;

  const { error: histErr } = await db.from("order_history").insert({
    order_id: order.id,
    status: "placed",
    at: new Date().toISOString(),
  });
  if (histErr) throw histErr;

  const { error: notifErr } = await db.from("notifications").insert({
    user_id: order.userId,
    message: `Order ${order.id} placed successfully!`,
    type: "order_placed",
    order_id: order.id,
  });
  if (notifErr) throw notifErr;

  return order.id;
}

export async function getOrders(userId: string) {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*), order_history(*), shipments(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getOrderById(orderId: string) {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*), order_history(*), shipments(*)")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data as any;
}

export async function getAllOrders() {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*), order_history(*), shipments(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function advanceOrder(
  orderId: string,
  status: OrderStatus,
  deliveryUserId?: string,
  note?: string
) {
  const updatePayload: Record<string, unknown> = { status };
  if (deliveryUserId) updatePayload.assigned_to = deliveryUserId;

  const { error: orderErr } = await db.from("orders").update(updatePayload).eq("id", orderId);
  if (orderErr) throw orderErr;

  const { error: histErr } = await db.from("order_history").insert({
    order_id: orderId,
    status,
    at: new Date().toISOString(),
    by: deliveryUserId ?? null,
    note: note ?? null,
  });
  if (histErr) throw histErr;

  const { error: shipErr } = await db
    .from("shipments").update({ shipment_status: status }).eq("order_id", orderId);
  if (shipErr) throw shipErr;

  const notifTypes: Partial<Record<OrderStatus, NotificationType>> = {
    shipped: "shipped",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
  };
  const notifType = notifTypes[status];
  if (notifType) {
    const msgMap: Record<string, string> = {
      shipped: `Your order ${orderId} has been shipped!`,
      out_for_delivery: `Your order ${orderId} is out for delivery!`,
      delivered: `Your order ${orderId} has been delivered!`,
    };
    const { data: ord } = await db.from("orders").select("user_id").eq("id", orderId).single();
    if (ord) {
      await db.from("notifications").insert({
        user_id: (ord as any).user_id,
        message: msgMap[notifType] ?? "",
        type: notifType,
        order_id: orderId,
      });
    }
  }
}

export async function cancelOrder(orderId: string, cancelledBy: "customer" | "admin") {
  await advanceOrder(orderId, "cancelled", undefined, `Cancelled by ${cancelledBy}`);
}

export async function claimOrder(orderId: string, agentId: string) {
  const { error: orderErr } = await db
    .from("orders")
    .update({ assigned_to: agentId, status: "packed" })
    .eq("id", orderId)
    .is("assigned_to", null);
  if (orderErr) throw orderErr;

  const { error: histErr } = await db.from("order_history").insert({
    order_id: orderId,
    status: "packed",
    at: new Date().toISOString(),
    by: agentId,
    note: "Claimed by delivery agent",
  });
  if (histErr) throw histErr;

  await db.from("shipments").update({ shipment_status: "packed" }).eq("order_id", orderId);
}

// ─────────────────────────────────────────────────────────────
// SHIPMENTS
// ─────────────────────────────────────────────────────────────

export async function createShipment(shipment: {
  id: string;
  orderId: string;
  courierPartner: string;
  trackingNumber: string;
  estimatedDeliveryDate: number;
}) {
  const { error } = await db.from("shipments").insert({
    id: shipment.id,
    order_id: shipment.orderId,
    courier_partner: shipment.courierPartner,
    tracking_number: shipment.trackingNumber,
    estimated_delivery_date: new Date(shipment.estimatedDeliveryDate).toISOString(),
    shipment_status: "placed",
  });
  if (error) throw error;
}

export async function getShipment(orderId: string) {
  const { data, error } = await db.from("shipments").select("*").eq("order_id", orderId).single();
  if (error) return null;
  return data as any;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const { data, error } = await db
    .from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function markNotificationsRead(userId: string) {
  const { error } = await db
    .from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────────────────────

export async function getAvailableOrders() {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .is("assigned_to", null)
    .not("status", "in", "(delivered,cancelled)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getMyDeliveries(agentId: string) {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*), order_history(*)")
    .eq("assigned_to", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────────────────────
// ADMIN — STATS
// ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [products, orders, users] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id, total, status"),
    db.from("profiles").select("id, role"),
  ]);

  const orderData = (orders.data ?? []) as { id: string; total: number; status: string }[];
  const userData = (users.data ?? []) as { id: string; role: string }[];

  const totalRevenue = orderData
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const activeOrders = orderData
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

  return {
    productCount: products.count ?? 0,
    orderCount: orderData.length,
    activeOrders,
    totalRevenue,
    userCount: userData.filter((u) => u.role === "user").length,
  };
}
