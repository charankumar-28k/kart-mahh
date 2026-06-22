/**
 * api.ts — Full Supabase backend API for ClassiAds
 * Covers every page: auth, products, orders, profile, addresses,
 * payments, reviews, wishlist, notifications, delivery, admin.
 */
import { supabase } from "./supabase";
import type { OrderStatus } from "./database.types";

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

/** Sign up a new customer */
export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: "user" } },
  });
  if (error) throw error;
  return data.user;
}

/** Sign in any user (customer, delivery, admin) */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/** Sign out */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get current authenticated user session */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Listen to auth state changes */
export function onAuthStateChange(cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(cb);
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

/** Fetch own profile */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

/** Update own profile */
export async function updateProfile(userId: string, patch: {
  name?: string; phone?: string; alt_phone?: string;
  house_no?: string; street?: string; city?: string;
  state?: string; country?: string; zip?: string;
  address?: string; location?: string; avatar?: string;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Change password via Supabase Auth */
export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Get all profiles — admin only */
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Get all delivery agents — admin only */
export async function getDeliveryAgents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "delivery");
  if (error) throw error;
  return data;
}

/** Create a delivery agent — admin only */
export async function createDeliveryAgent(name: string, email: string, password: string, phone: string) {
  const { data, error } = await supabase.rpc("create_delivery_agent", {
    agent_name: name,
    agent_email: email,
    agent_password: password,
    agent_phone: phone,
  });
  if (error) throw error;
  return data as string; // returns new user UUID
}

/** Delete a delivery agent — admin only */
export async function deleteDeliveryAgent(agentId: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", agentId).eq("role", "delivery");
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SAVED ADDRESSES
// ─────────────────────────────────────────────────────────────

export async function getSavedAddresses(userId: string) {
  const { data, error } = await supabase
    .from("saved_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addSavedAddress(userId: string, addr: {
  label: string; name: string; phone: string; line1: string; city: string; zip: string;
}) {
  const { data, error } = await supabase
    .from("saved_addresses")
    .insert({ ...addr, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedAddress(id: string) {
  const { error } = await supabase.from("saved_addresses").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────────────────────

export async function getPaymentMethods(userId: string) {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addPaymentMethod(userId: string, pm: {
  brand: string; last4: string; holder: string; expiry: string;
}) {
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ ...pm, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePaymentMethod(id: string) {
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────

export async function getProducts(filters?: {
  category?: string; subcategory?: string; search?: string;
  tags?: string[]; sort?: "price_asc" | "price_desc" | "rating" | "newest";
}) {
  let query = supabase.from("products").select("*, reviews(*)");

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
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, reviews(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProduct(product: {
  id?: string; title: string; price: number; old_price?: number;
  image: string; category: string; subcategory: string; rating: number;
  description: string; tags: string[]; stock: number; location: string; seller_id: string;
}) {
  const { data, error } = await supabase
    .from("products")
    .upsert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProductStock(id: string, stockDelta: number) {
  const { error } = await supabase.rpc("adjust_product_stock", { product_id: id, delta: stockDelta });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function getReviews(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addReview(productId: string, userId: string, userName: string, rating: number, comment: string) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({ product_id: productId, user_id: userId, user_name: userName, rating, comment })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────

export async function getWishlist(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("wishlist")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.wishlist ?? [];
}

export async function toggleWishlist(userId: string, productId: string) {
  const current = await getWishlist(userId);
  const updated = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  const { error } = await supabase
    .from("profiles")
    .update({ wishlist: updated })
    .eq("id", userId);
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
  // 1. Insert order
  const { error: orderErr } = await supabase.from("orders").insert({
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

  // 2. Insert order items
  const { error: itemsErr } = await supabase.from("order_items").insert(
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

  // 3. Insert initial history entry
  const { error: histErr } = await supabase.from("order_history").insert({
    order_id: order.id,
    status: "placed",
    at: new Date().toISOString(),
  });
  if (histErr) throw histErr;

  // 4. Insert notification
  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: order.userId,
    message: `Order ${order.id} placed successfully!`,
    type: "order_placed",
    order_id: order.id,
  });
  if (notifErr) throw notifErr;

  return order.id;
}

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_history(*), shipments(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_history(*), shipments(*)")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllOrders() {
  const { data, error } = await supabase.rpc("get_all_orders_for_admin");
  if (error) { console.error("getAllOrders error:", error); throw error; }
  return (data ?? []) as any[];
}

export async function advanceOrder(
  orderId: string,
  status: OrderStatus,
  deliveryUserId?: string,
  note?: string
) {
  // Update order status
  const updatePayload: Record<string, unknown> = { status };
  if (deliveryUserId) updatePayload.assigned_to = deliveryUserId;
  const { error: orderErr } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);
  if (orderErr) throw orderErr;

  // Append history
  const { error: histErr } = await supabase.from("order_history").insert({
    order_id: orderId,
    status,
    at: new Date().toISOString(),
    by: deliveryUserId ?? null,
    note: note ?? null,
  });
  if (histErr) throw histErr;

  // Update shipment status
  const { error: shipErr } = await supabase
    .from("shipments")
    .update({ shipment_status: status })
    .eq("order_id", orderId);
  if (shipErr) throw shipErr;

  // Notification for milestones
  const notifTypes: Partial<Record<OrderStatus, string>> = {
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
    const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
    if (order) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        message: msgMap[status],
        type: notifType as never,
        order_id: orderId,
      });
    }
  }
}

/** Cancel an order — customer cancels their own order via RPC to bypass RLS */
export async function cancelOrder(orderId: string, cancelledBy: "customer" | "admin") {
  const { error } = await supabase.rpc("cancel_order_by_user", {
    p_order_id: orderId,
    p_note: `Cancelled by ${cancelledBy}`,
  });
  if (error) { console.error("cancelOrder error:", error); throw error; }
}

/** Claim an order as a delivery agent — saves agent ID to DB */
export async function claimOrder(orderId: string, agentId: string) {
  // 1. Assign agent + set status to packed
  const { error: orderErr } = await supabase
    .from("orders")
    .update({ assigned_to: agentId, status: "packed" })
    .eq("id", orderId)
    .is("assigned_to", null); // only claim if not already taken
  if (orderErr) throw orderErr;

  // 2. Record in order_history
  const { error: histErr } = await supabase.from("order_history").insert({
    order_id: orderId,
    status: "packed",
    at: new Date().toISOString(),
    by: agentId,
    note: "Claimed by delivery agent",
  });
  if (histErr) throw histErr;

  // 3. Update shipment status
  await supabase.from("shipments")
    .update({ shipment_status: "packed" })
    .eq("order_id", orderId);
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
  const { error } = await supabase.from("shipments").insert({
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
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .single();
  if (error) return null;
  return data;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function markNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────────────────────

/** Orders available to claim (not yet assigned, not delivered/cancelled) */
export async function getAvailableOrders() {
  const { data, error } = await supabase.rpc("get_available_orders_for_delivery");
  if (error) { console.error("getAvailableOrders error:", error); throw error; }
  return (data ?? []) as any[];
}

export async function getMyDeliveries(agentId: string) {
  const { data, error } = await supabase.rpc("get_my_deliveries", { agent_id: agentId });
  if (error) { console.error("getMyDeliveries error:", error); throw error; }
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────────────────────
// ADMIN — STATS
// ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [products, orders, users] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, total, status"),
    supabase.from("profiles").select("id, role", { count: "exact" }),
  ]);

  const totalRevenue = (orders.data ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const activeOrders = (orders.data ?? [])
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

  return {
    productCount: products.count ?? 0,
    orderCount: orders.data?.length ?? 0,
    activeOrders,
    totalRevenue,
    userCount: (users.data ?? []).filter((u) => u.role === "user").length,
  };
}
