-- ============================================================
-- ClassiAds — Supabase Schema (idempotent — safe to re-run)
-- Paste & run this entire file in your Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ── DROP EVERYTHING FIRST (safe re-run) ─────────────────────
drop table if exists notifications   cascade;
drop table if exists shipments       cascade;
drop table if exists order_history   cascade;
drop table if exists order_items     cascade;
drop table if exists orders          cascade;
drop table if exists reviews         cascade;
drop table if exists products        cascade;
drop table if exists payment_methods cascade;
drop table if exists saved_addresses cascade;
drop table if exists profiles        cascade;

drop type if exists notification_type cascade;
drop type if exists payment_status    cascade;
drop type if exists order_status      cascade;
drop type if exists user_role         cascade;

-- ── ENUMS ───────────────────────────────────────────────────
create type user_role         as enum ('user', 'delivery', 'admin');
create type order_status      as enum ('placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled');
create type payment_status    as enum ('pending', 'paid', 'failed', 'refunded');
create type notification_type as enum ('order_placed', 'payment_success', 'shipped', 'out_for_delivery', 'delivered');

-- ── PROFILES (extends auth.users 1-to-1) ────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  role        user_role not null default 'user',
  phone       text,
  alt_phone   text,
  address     text,
  house_no    text,
  street      text,
  city        text,
  state       text,
  country     text,
  zip         text,
  location    text,
  avatar      text,
  wishlist    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── SAVED ADDRESSES ─────────────────────────────────────────
create table saved_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  label       text not null,
  name        text not null,
  phone       text not null,
  line1       text not null,
  city        text not null,
  zip         text not null,
  created_at  timestamptz not null default now()
);

-- ── PAYMENT METHODS ─────────────────────────────────────────
create table payment_methods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  brand       text not null,
  last4       text not null,
  holder      text not null,
  expiry      text not null,
  created_at  timestamptz not null default now()
);

-- ── PRODUCTS ────────────────────────────────────────────────
create table products (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  price        numeric(10,2) not null check (price >= 0),
  old_price    numeric(10,2) check (old_price >= 0),
  image        text not null,
  category     text not null,
  subcategory  text not null,
  rating       numeric(3,1) not null default 0 check (rating >= 0 and rating <= 5),
  description  text not null default '',
  tags         text[] not null default '{}',
  stock        int not null default 0 check (stock >= 0),
  location     text not null default '',
  seller_id    uuid not null references profiles(id) on delete cascade,
  sold         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── REVIEWS ─────────────────────────────────────────────────
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  user_name   text not null,
  rating      int not null check (rating >= 1 and rating <= 5),
  comment     text not null,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ── ORDERS ──────────────────────────────────────────────────
create table orders (
  id               text primary key,
  user_id          uuid not null references profiles(id) on delete cascade,
  subtotal         numeric(10,2) not null,
  tax              numeric(10,2) not null default 0,
  shipping         numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  address_name     text not null,
  address_phone    text not null,
  address_line1    text not null,
  address_city     text not null,
  address_zip      text not null,
  payment          text not null,
  payment_status   payment_status not null default 'pending',
  status           order_status not null default 'placed',
  assigned_to      uuid references profiles(id) on delete set null,
  shipment_id      text,
  transaction_ref  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── ORDER ITEMS ─────────────────────────────────────────────
create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id) on delete restrict,
  title       text not null,
  price       numeric(10,2) not null,
  qty         int not null check (qty > 0),
  image       text not null
);

-- ── ORDER HISTORY ───────────────────────────────────────────
create table order_history (
  id        uuid primary key default gen_random_uuid(),
  order_id  text not null references orders(id) on delete cascade,
  status    order_status not null,
  at        timestamptz not null default now(),
  by        uuid references profiles(id) on delete set null,
  note      text
);

-- ── SHIPMENTS ───────────────────────────────────────────────
create table shipments (
  id                       text primary key,
  order_id                 text not null references orders(id) on delete cascade,
  courier_partner          text not null,
  tracking_number          text not null,
  estimated_delivery_date  timestamptz not null,
  shipment_status          order_status not null default 'placed',
  created_at               timestamptz not null default now()
);

-- ── NOTIFICATIONS ───────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  message     text not null,
  type        notification_type not null,
  order_id    text not null references orders(id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on products (category);
create index on products (seller_id);
create index on products (created_at desc);
create index on orders (user_id);
create index on orders (status);
create index on orders (assigned_to);
create index on orders (created_at desc);
create index on order_items (order_id);
create index on order_history (order_id);
create index on reviews (product_id);
create index on notifications (user_id, read);
create index on saved_addresses (user_id);
create index on payment_methods (user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products for each row execute function set_updated_at();

create trigger trg_orders_updated_at
  before update on orders for each row execute function set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles         enable row level security;
alter table saved_addresses  enable row level security;
alter table payment_methods  enable row level security;
alter table products         enable row level security;
alter table reviews          enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table order_history    enable row level security;
alter table shipments        enable row level security;
alter table notifications    enable row level security;

create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- profiles
create policy "own profile read"    on profiles for select using (auth.uid() = id);
create policy "admin read profiles" on profiles for select using (current_user_role() = 'admin');
create policy "own profile update"  on profiles for update using (auth.uid() = id);

-- saved_addresses
create policy "own addresses" on saved_addresses for all using (auth.uid() = user_id);

-- payment_methods
create policy "own payments" on payment_methods for all using (auth.uid() = user_id);

-- products
create policy "anyone reads products" on products for select using (true);
create policy "admin insert product"  on products for insert with check (current_user_role() = 'admin');
create policy "admin update product"  on products for update using (current_user_role() = 'admin');
create policy "admin delete product"  on products for delete using (current_user_role() = 'admin');

-- reviews
create policy "anyone reads reviews"  on reviews for select using (true);
create policy "auth user adds review" on reviews for insert with check (auth.uid() = user_id);
create policy "own review delete"     on reviews for delete using (auth.uid() = user_id);

-- orders
create policy "own orders read"         on orders for select using (auth.uid() = user_id);
create policy "delivery reads assigned" on orders for select using (auth.uid() = assigned_to);
create policy "admin reads all orders"  on orders for select using (current_user_role() = 'admin');
create policy "auth user places order"  on orders for insert with check (auth.uid() = user_id);
create policy "staff updates order"     on orders for update using (
  current_user_role() = 'admin' or current_user_role() = 'delivery' or auth.uid() = user_id
);

-- order_items
create policy "own order items"         on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "admin reads order items" on order_items for select using (current_user_role() = 'admin');
create policy "delivery reads items"    on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.assigned_to = auth.uid())
);
create policy "insert own order items"  on order_items for insert with check (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- order_history
create policy "own order history"      on order_history for select using (
  exists (select 1 from orders where orders.id = order_history.order_id and orders.user_id = auth.uid())
);
create policy "admin reads history"    on order_history for select using (current_user_role() = 'admin');
create policy "delivery reads history" on order_history for select using (
  exists (select 1 from orders where orders.id = order_history.order_id and orders.assigned_to = auth.uid())
);
create policy "staff inserts history"  on order_history for insert with check (
  current_user_role() = 'admin' or current_user_role() = 'delivery'
);

-- shipments
create policy "own shipments"           on shipments for select using (
  exists (select 1 from orders where orders.id = shipments.order_id and orders.user_id = auth.uid())
);
create policy "staff reads shipments"   on shipments for select using (
  current_user_role() = 'admin' or current_user_role() = 'delivery'
);
create policy "admin manages shipments" on shipments for all using (current_user_role() = 'admin');

-- notifications
create policy "own notifications read"   on notifications for select using (auth.uid() = user_id);
create policy "own notifications update" on notifications for update using (auth.uid() = user_id);
create policy "system inserts notifs"    on notifications for insert with check (true);

-- ============================================================
-- AFTER SETUP: promote a user to admin
-- update profiles set role = 'admin' where email = 'your@email.com';
-- ============================================================

-- ============================================================
-- ENABLE REALTIME (run this in Supabase SQL Editor)
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_history;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table shipments;

