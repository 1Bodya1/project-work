# Frontend audit (React/Vite) — Solution store

## 1) `src` structure check
- The codebase has **two app entry implementations** at once: legacy `src/App.jsx` + `src/main.jsx` and TS app shell `src/app/App.tsx` + router under `src/app/*`.
- Active UI/pages are in `src/app/pages`, shared components in `src/app/components`, layouts in `src/app/layouts`, routing in `src/app/routes.tsx`.

## 2) Required pages status
- **Found**: Home, Catalog, ProductDetails, Customizer, Cart, Checkout, Login, Register, Profile, OrderDetails, Support, AdminDashboard, AdminProducts, AdminOrders, AdminSupport.
- **Missing as separate page**: Orders list page (only Profile order history + `OrderDetails` route exists).

## 3) Static-UI-only pages
Currently mostly mock/static (no backend/API integration, local state or constants only):
- Home
- Catalog
- ProductDetails
- Customizer
- Cart
- Checkout
- Login
- Register
- Profile
- OrderDetails
- Support
- AdminDashboard
- AdminProducts
- AdminOrders
- AdminSupportTickets

## 4) Hardcoded data hotspots
Hardcoded arrays/values are embedded in page components (products, cart items, orders, tickets, user profile, stats):
- `src/app/pages/Home.tsx` (`featuredProducts`)
- `src/app/pages/Catalog.tsx` (`allProducts`)
- `src/app/pages/ProductDetails.tsx` (mock product/options/reviews)
- `src/app/pages/Customizer.tsx` (mock template/product constraints)
- `src/app/pages/Cart.tsx` (`items` in component state)
- `src/app/pages/Checkout.tsx` (`cartItems`, simulated payment)
- `src/app/pages/Profile.tsx` (`orders`, user defaults)
- `src/app/pages/OrderDetails.tsx` (mock order object)
- `src/app/pages/Support.tsx` (mock tickets/form behavior)
- `src/app/pages/admin/Dashboard.tsx` (mock KPIs/charts)
- `src/app/pages/admin/Products.tsx` (`products`)
- `src/app/pages/admin/Orders.tsx` (mock orders + statuses)
- `src/app/pages/admin/SupportTickets.tsx` (`tickets`)
- also UI constants in `src/app/components/Header.tsx` (e.g., cart badge `3`, auth flag in local state)

## 5) Missing/broken routes
- No dedicated `/orders` page route, despite requirement "Orders / OrderDetails".
- Header "Orders" menu points to `/profile`, not an orders page.
- Route set includes inline `/about` component instead of page file (not broken, but inconsistent with page-based architecture).

## 6) Vite config duplication
- Both `vite.config.js` and `vite.config.ts` exist simultaneously.
- This can cause ambiguity/maintenance drift; keep one canonical config.

## 7) `package.json` scripts check
- `dev` ✅
- `build` ✅
- `preview` ✅

## Recommended frontend fix plan (without redesign)
1. **Routing cleanup**
   - Add dedicated `Orders` page (`/orders`) and link Header/Profile to it.
   - Keep `/orders/:orderId` for details.
2. **Data layer extraction**
   - Move hardcoded arrays into a temporary data module (`src/app/mocks/*`) as step 1.
   - Replace inline constants with hooks/services (`useProducts`, `useCart`, `useOrders`, `useSupport`, `useAdmin*`).
3. **API integration skeleton**
   - Add typed API client (fetch/axios), DTOs, error/loading handling.
   - Wire pages to async queries + mutations.
4. **Auth/cart global state**
   - Replace local `isLoggedIn` and hardcoded cart badge with context/store.
5. **Config unification**
   - Leave only one Vite config (prefer `vite.config.ts` in TS-heavy codebase).
6. **Architecture consistency**
   - Decide single app entrypoint and remove unused legacy shell files.
