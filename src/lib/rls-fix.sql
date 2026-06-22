-- ============================================================
-- ClassiAds — RLS FIX
-- Run this entire file in Supabase SQL Editor
-- This fixes admin and delivery not seeing orders
-- ============================================================

-- ── Drop all existing order-related policies ─────────────────
drop policy if exists "own orders read"          on orders;
drop policy if exists "delivery reads assigned"  on orders;
drop policy if exists "admin reads all orders"   on orders;
drop policy if exists "auth user places order"   on orders;
drop policy if exists "staff updates order"      on orders;

drop policy if exists "own order items"          on order_items;
drop policy if exists "admin reads order items"  on order_items;
drop policy if exists "delivery reads items"     on order_items;
drop policy if exists "insert own order items"   on order_items;

drop policy if exists "own order history"        on order_history;
drop policy if exists "admin reads history"      on order_history;
drop policy if exists "delivery reads history"   on order_history;
drop policy if exists "staff inserts history"    on order_history;

drop policy if exists "own shipments"            on shipments;
drop policy if exists "staff reads shipments"    on shipments;
drop policy if exists "admin manages shipments"  on shipments;

drop policy if exists "own notifications read"   on notifications;
drop policy if exists "own notifications update" on notifications;
drop policy if exists "system inserts notifs"    on notifications;

drop policy if exists "own profile read"         on profiles;
drop policy if exists "admin read profiles"      on profiles;
drop policy if exists "own profile update"       on profiles;

-- ── Recreate current_user_role helper ────────────────────────
create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- ── PROFILES ─────────────────────────────────────────────────
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id or current_user_role() = 'admin');

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles: insert on signup"
  on profiles for insert
  with check (auth.uid() = id);

-- ── ORDERS ───────────────────────────────────────────────────
-- Admin sees ALL orders
create policy "orders: admin read all"
  on orders for select
  using (current_user_role() = 'admin');

-- Customer sees own orders
create policy "orders: customer read own"
  on orders for select
  using (auth.uid() = user_id);

-- Delivery sees assigned orders AND unassigned available orders
create policy "orders: delivery read"
  on orders for select
  using (
    current_user_role() = 'delivery'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

-- Anyone authenticated can place an order
create policy "orders: insert"
  on orders for insert
  with check (auth.uid() = user_id);

-- Admin, delivery, and customer (for cancel) can update
create policy "orders: update"
  on orders for update
  using (
    current_user_role() = 'admin'
    or current_user_role() = 'delivery'
    or auth.uid() = user_id
  );

-- ── ORDER ITEMS ──────────────────────────────────────────────
create policy "order_items: admin read"
  on order_items for select
  using (current_user_role() = 'admin');

create policy "order_items: customer read own"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "order_items: delivery read"
  on order_items for select
  using (
    current_user_role() = 'delivery'
    and exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and (orders.assigned_to = auth.uid() or orders.assigned_to is null)
    )
  );

create policy "order_items: insert"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ── ORDER HISTORY ────────────────────────────────────────────
create policy "order_history: admin read"
  on order_history for select
  using (current_user_role() = 'admin');

create policy "order_history: customer read own"
  on order_history for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "order_history: delivery read"
  on order_history for select
  using (
    current_user_role() = 'delivery'
    and exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and (orders.assigned_to = auth.uid() or orders.assigned_to is null)
    )
  );

create policy "order_history: insert"
  on order_history for insert
  with check (
    current_user_role() = 'admin'
    or current_user_role() = 'delivery'
    or exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ── SHIPMENTS ────────────────────────────────────────────────
create policy "shipments: admin read"
  on shipments for select
  using (current_user_role() = 'admin');

create policy "shipments: customer read own"
  on shipments for select
  using (
    exists (
      select 1 from orders
      where orders.id = shipments.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "shipments: delivery read"
  on shipments for select
  using (
    current_user_role() = 'delivery'
    and exists (
      select 1 from orders
      where orders.id = shipments.order_id
      and (orders.assigned_to = auth.uid() or orders.assigned_to is null)
    )
  );

create policy "shipments: insert"
  on shipments for insert
  with check (
    current_user_role() = 'admin'
    or exists (
      select 1 from orders
      where orders.id = shipments.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "shipments: update"
  on shipments for update
  using (
    current_user_role() = 'admin'
    or current_user_role() = 'delivery'
  );

-- ── NOTIFICATIONS ────────────────────────────────────────────
create policy "notifications: own read"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: own update"
  on notifications for update
  using (auth.uid() = user_id);

create policy "notifications: insert"
  on notifications for insert
  with check (true);
