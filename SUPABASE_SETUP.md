# Supabase Setup Guide — ClassiAds

## Step 1 — Create a Supabase Project
1. Go to https://supabase.com and sign in
2. Click **New Project**, give it a name (e.g. `classiads`)
3. Choose a region close to you and set a database password
4. Wait for the project to be ready (~1 min)

## Step 2 — Run the SQL Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open `src/lib/schema.sql` from this project
3. Paste the entire contents into the SQL Editor
4. Click **Run** — all tables, indexes, RLS policies and triggers will be created

## Step 3 — Get your API keys
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
3. Open `.env` in the project root and fill them in:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEMO_PASSWORD=demo1234
```

## Step 4 — Install Supabase package
```bash
npm install @supabase/supabase-js
# or
bun add @supabase/supabase-js
```

## Step 5 — Create demo users in Supabase Auth
1. Go to **Authentication → Users → Add User**
2. Create these 3 users:
   - `user@demo.com` / `demo1234`
   - `delivery@demo.com` / `demo1234`
   - `admin@demo.com` / `demo1234`
3. After creating them, go to **SQL Editor** and run:
```sql
update profiles set role = 'delivery' where email = 'delivery@demo.com';
update profiles set role = 'admin'    where email = 'admin@demo.com';
```

## Step 6 — Enable Email Auth
1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. For development, disable **Email confirmations** so login works instantly

## Step 7 — Using Supabase in your components

Replace imports from `../lib/store` with `../lib/supabase-store`:

```tsx
// Before (localStorage store)
import { useStore, login, logout } from "../lib/store";

// After (Supabase)
import { useSupabaseStore, useCurrentUser } from "../lib/supabase-store";

function MyComponent() {
  const { signIn, signOut, user, orders, placeOrder } = useSupabaseStore();
  // ...
}
```

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/database.types.ts` | TypeScript types for every table |
| `src/lib/schema.sql` | Full SQL schema — run in Supabase SQL Editor |
| `src/lib/api.ts` | All backend API functions (auth, products, orders, etc.) |
| `src/lib/supabase-store.ts` | React context + hooks replacing localStorage store |

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | Users (extends Supabase auth.users) |
| `saved_addresses` | User saved delivery addresses |
| `payment_methods` | Saved cards/wallets |
| `products` | Product catalogue |
| `reviews` | Product reviews (1 per user per product) |
| `orders` | Customer orders |
| `order_items` | Line items for each order |
| `order_history` | Status timeline for each order |
| `shipments` | Shipment tracking per order |
| `notifications` | In-app notifications |

## API Functions (src/lib/api.ts)

### Auth
- `signUp(name, email, password)`
- `signIn(email, password)`
- `signOut()`
- `getSession()`

### Profile
- `getProfile(userId)`
- `updateProfile(userId, patch)`
- `changePassword(newPassword)`
- `getAllProfiles()` — admin
- `getDeliveryAgents()` — admin
- `createDeliveryAgent(name, email, password, phone)` — admin
- `deleteDeliveryAgent(agentId)` — admin

### Products
- `getProducts(filters?)` — supports category, search, tags, sort
- `getProductById(id)`
- `upsertProduct(product)` — admin
- `deleteProduct(id)` — admin

### Orders
- `placeOrder(order)`
- `getOrders(userId)`
- `getOrderById(orderId)`
- `getAllOrders()` — admin
- `advanceOrder(orderId, status, agentId?, note?)`
- `cancelOrder(orderId, cancelledBy)`

### Reviews
- `getReviews(productId)`
- `addReview(productId, userId, userName, rating, comment)`

### Wishlist
- `getWishlist(userId)`
- `toggleWishlist(userId, productId)`

### Addresses
- `getSavedAddresses(userId)`
- `addSavedAddress(userId, addr)`
- `deleteSavedAddress(id)`

### Payments
- `getPaymentMethods(userId)`
- `addPaymentMethod(userId, pm)`
- `deletePaymentMethod(id)`

### Notifications
- `getNotifications(userId)`
- `markNotificationsRead(userId)`

### Delivery
- `getAvailableOrders()`
- `getMyDeliveries(agentId)`

### Admin Stats
- `getAdminStats()` — returns productCount, orderCount, activeOrders, totalRevenue, userCount
