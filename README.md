# ClassiAds — Full Stack E-Commerce Marketplace

A modern, full-stack e-commerce marketplace built with **React**, **TypeScript**, **Vite**, **TanStack Router**, **Tailwind CSS**, and **Supabase**.

---

## Features

### Customer Portal
- Browse products by category, tag, and search
- Product detail pages with reviews and ratings
- Add to cart / Buy Now
- Checkout with saved or new address
- Order tracking with live status updates
- Cancel orders (placed or packed only)
- Wishlist
- Profile management (address, payment methods, notifications)
- Real-time notifications (order placed, shipped, delivered)

### Admin Portal
- Product management — add, edit, delete products with image, stock, tags
- View all orders in real time
- Advance or cancel any order
- Manage delivery agents — create, delete, reset password
- User management — view all registered customers
- Revenue and stats dashboard

### Delivery Portal
- View available (unclaimed) orders
- Claim & pack orders — agent ID stored in database
- Advance order status (packed → shipped → out for delivery → delivered)
- View assigned deliveries and completed history
- Real-time sync — new orders appear automatically

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6 |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4, tw-animate-css |
| UI Components | Radix UI, Lucide React |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| State | React Context + Supabase Realtime + Polling |

---

## Project Structure

```
src/
├── assets/          # Product images
├── components/
│   ├── ui/          # Radix UI components (button, card, etc.)
│   ├── SiteLayout.tsx   # Header, footer, notification bell
│   └── ...
├── lib/
│   ├── api.ts           # All Supabase API functions
│   ├── supabase.ts      # Supabase client
│   ├── supabase-store.tsx  # React context + hooks (replaces localStorage)
│   ├── store.ts         # Legacy types (ORDER_LABEL, ORDER_STAGES, etc.)
│   ├── database.types.ts   # TypeScript types for all DB tables
│   ├── schema.sql       # Full Supabase database schema
│   ├── rls-fix.sql      # Row Level Security policies
│   ├── rpc-functions.sql   # Security definer RPC functions
│   └── cancel-order-rpc.sql  # Cancel order RPC
├── routes/
│   ├── index.tsx        # Home page
│   ├── login.tsx        # Customer login / register
│   ├── staff-login.tsx  # Admin & delivery login
│   ├── admin.tsx        # Admin portal
│   ├── delivery.tsx     # Delivery portal
│   ├── checkout.tsx     # Checkout flow
│   ├── orders.tsx       # Customer orders
│   ├── profile.tsx      # Profile management
│   └── ...
└── main.tsx
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | Users (extends Supabase auth.users) |
| `products` | Product catalogue |
| `reviews` | Product reviews (1 per user per product) |
| `orders` | Customer orders |
| `order_items` | Line items per order |
| `order_history` | Status timeline per order |
| `shipments` | Shipment tracking |
| `notifications` | In-app notifications |
| `saved_addresses` | User saved delivery addresses |
| `payment_methods` | Saved cards/wallets |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/classiads.git
cd classiads
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run these files in order:
   - `src/lib/schema.sql` — creates all tables, indexes, triggers, RLS
   - `src/lib/rls-fix.sql` — fixes RLS policies for all roles
   - `src/lib/rpc-functions.sql` — creates security definer functions
   - `src/lib/cancel-order-rpc.sql` — creates cancel order function
3. Go to **Authentication → Providers → Email** and disable **Confirm email** (for dev)
4. Go to **Project Settings → API** and copy your URL and anon key

### 4. Configure environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Create your admin user

1. Register via the app's `/login` page
2. In Supabase **SQL Editor** run:
```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

### 6. Run the app

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## User Roles

| Role | Access |
|------|--------|
| `user` | Shop, orders, profile, wishlist |
| `delivery` | Delivery portal — claim and advance orders |
| `admin` | Admin portal — full control over products, orders, users |

To create a delivery agent, log in as admin → Admin Portal → Delivery Agents → Add Agent.

---

## Real-time Sync

All three portals (customer, admin, delivery) stay in sync using:

- **Supabase Realtime** — instant push on order/product changes
- **5-second polling** — fallback guarantee even if Realtime is off

When a customer places an order:
1. Order is saved to Supabase
2. Admin portal receives it within seconds
3. Delivery portal shows it in the **Available** tab
4. Delivery agent claims it → `assigned_to` is stored in DB
5. Customer sees status updates in real time

---

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

> `.env` is in `.gitignore` — never commit your keys.

---

## License

MIT
