# Frontend Backend Integration Fix Report

## What was broken

- API client dispatched auth/session events too broadly for 401 responses, which could log users out for unrelated backend failures.
- Backend auth responses were not normalized consistently across common shapes such as `{ token, user }`, `{ data: { token, user } }`, `{ accessToken, user }`, and `{ token, data: user }`.
- Product data from backend could lose customizer-critical fields such as `mockupsByColor`, `model3dUrl`, `printAreas`, `customizationMode`, and local mockup paths.
- Product service contained duplicate normalizer/service definitions, making backend-mode behavior unpredictable.
- Order, support, payment, delivery, and admin services relied on narrow endpoint paths while the backend can expose compatible aliases.
- Backend-mode support/order/payment failures could silently create local fake records, hiding endpoint mismatches.

## What was fixed

- `api.ts` now attaches `Authorization: Bearer <token>` only when a token exists, never clears session directly, and never logs users out on 403.
- Auth fallback is limited to `VITE_USE_BACKEND=false`. In backend mode, login/register failures surface as real errors.
- `authService` normalizes backend users to `{ id, firstName, lastName, name, email, phone, role }`.
- `/auth/me` is the only session check that clears local auth after a real 401 invalid/expired token.
- `productService` was rebuilt into a single backend-aware normalizer with safe mock fallback.
- Backend product responses are normalized into the frontend `Product` shape while preserving 2D/3D customizer fields.
- Support, order, payment, delivery, and admin services now use endpoint aliases where needed.
- Support and order creation no longer silently create fake backend-mode data on backend failure.
- Admin dashboard tries `/admin/dashboard` stats and falls back to computed stats from orders/tickets.

## Endpoints used

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/profile`, fallback `PATCH /users/me`.
- Products: `GET /products`, `GET /products/:id`, `GET /categories`, admin `POST/PATCH/DELETE /admin/products`.
- Designs: `POST /custom-designs`, `GET /custom-designs/:id`, `GET /custom-designs/product/:productId`, upload `/uploads/designs`.
- Cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart`.
- Orders: `POST /orders`, `GET /orders`, `GET /orders/my`, `GET /orders/:id`.
- Admin orders: `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id`, `PATCH /admin/orders/:id/tracking`.
- Payment: `POST /payments/monobank`, `PATCH /payments/:orderId/status`, `GET /payments/monobank/status/:invoiceId`.
- Delivery: `GET /delivery/nova-poshta/:trackingNumber`.
- Support: `POST /support/tickets`, `GET /support/tickets/my`, `GET /admin/support/tickets`, `PATCH /admin/support/tickets/:id`.
- Admin dashboard: `GET /admin/dashboard`.

## Endpoint fallbacks

- Designs: `/custom-designs` -> `/designs`; `/custom-designs/product/:productId` -> `/designs/by-product/:productId`; upload `/uploads/designs` -> `/uploads/design-image` -> `/designs/upload`.
- Orders: `/orders/my` -> `/orders`; admin `/admin/orders` -> `/orders/admin/all`; admin details `/admin/orders/:id` -> `/orders/admin/:id`.
- Admin order updates: `/admin/orders/:id` -> `/orders/admin/:id/status`; tracking `/admin/orders/:id/tracking` -> `/orders/admin/:id/tracking`.
- Payment create: `/payments/monobank` -> `/payments/monobank/create` -> `/payments/monobank/create-invoice` -> `/orders/:id/pay`.
- Delivery: `/delivery/nova-poshta/:trackingNumber` -> `/delivery/novaposhta/status/:trackingNumber` -> `/delivery/track/:trackingNumber`.
- Support: `/support/tickets` -> `/support`; `/support/tickets/my` -> `/support/my`; admin `/admin/support/tickets` -> `/support/admin/all`; admin status `/admin/support/tickets/:id` -> `/support/admin/:id/status`.

## Auth behavior

- Token is stored at localStorage key `token`.
- User is stored at localStorage key `user`.
- App reload calls `/auth/me` when a token exists.
- A real 401 from `/auth/me` clears local session and dispatches `auth:unauthorized`.
- Network/backend errors during `/auth/me` keep the stored user available instead of instantly logging out.
- 403 admin forbidden does not clear auth.
- Admin navigation only routes to `/admin`; logout only happens through the Logout action.

## Product normalizer rules

- `id` supports `id`, `_id`, or `productId`.
- `name/title`, `price`, `category`, `productType`, `customizationMode`, `colors`, `sizes`, `stock`, `isCustomizable`, `customizable`, `image`, `images`, `mockups`, `mockupsByColor`, `model3dUrl`, `printAreas`, and `printArea` are normalized.
- Product type is inferred from explicit type first, then category/name/title.
- Missing T-shirt `model3dUrl` becomes `/models/tshirt.glb`.
- Missing mug/laptop model URLs become `/models/mug.glb` and `/models/laptop.glb`.
- Missing print areas fall back to product-type defaults.
- Old Unsplash product images are ignored for customizer-critical previews when local mockups are available.
- Missing `mockupsByColor` is inferred from colors and existing mockups.

## Known limitations

- Public Catalog is still intentionally filtered to T-shirt products for now.
- Mug/Laptop product structures are ready, but the public catalog does not expose them yet.
- File upload persistence depends on backend upload support; local object URLs are still used in mock mode.
- Payment redirects depend on backend returning `paymentUrl` or `redirectUrl`.
- Delivery tracking depends on backend Nova Poshta endpoint availability in backend mode.

## Manual demo checklist

- Register a new user and confirm localStorage contains `token` and normalized `user`.
- Log in and reload the app; `/auth/me` should restore the user.
- Click Admin as a non-admin user; the user should not be logged out.
- Browse Catalog and confirm only T-shirt products are visible.
- Open ProductDetails and Customizer for a backend T-shirt product; verify 2D, 3D, colors, and print areas still work.
- Save a design and confirm product-specific design data is preserved.
- Add customized product to cart and confirm the cart preview uses `screenshot3dUrl`/`previewUrl`.
- Checkout with a customized item and confirm customized fields are included in order payload.
- Open Orders and OrderDetails; confirm preview, payment status, delivery status, and tracking number render.
- Create a support ticket and confirm it appears in user support history.
- As admin, check dashboard, products, orders, tracking update, and support status update.
- Run `npm run build`.
