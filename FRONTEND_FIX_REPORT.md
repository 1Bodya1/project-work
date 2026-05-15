# Frontend Fix Report

## What was broken

- Product cards could resolve to missing mockup paths, which made product images disappear.
- Backend responses wrapped in `{ data: ... }` were not always unwrapped deeply enough for products, cart, orders, and auth.
- Backend cart responses could normalize as empty, so the cart appeared cleared after refresh.
- Backend auth errors were hidden behind generic UI errors, making register/login/profile failures hard to diagnose.
- Registration sent an extra `name` field even though the backend contract expects `firstName`, `lastName`, `email`, `phone`, and `password`.
- Checkout had provider plumbing but payment/order payloads did not consistently preserve the selected provider in backend-friendly lowercase form.

## Auth fixes

- `api.ts` attaches `Authorization: Bearer <token>` only when a token exists.
- `api.ts` no longer clears session on arbitrary 401 responses and does not clear on 403.
- Network failures are returned as `ApiError` with status `0` and useful messages.
- `unwrapApiData` now supports nested payloads such as `{ data: { token, user } }` and `{ data: { items } }`.
- `authService` keeps mock login/register only when `VITE_USE_BACKEND=false`.
- Register posts backend-required fields only: `firstName`, `lastName`, `email`, `phone`, `password`.
- Login/register forms display backend error messages instead of silently creating fake users in backend mode.
- `/auth/me` restores normalized users on reload and clears session only on confirmed 401 invalid/expired token.
- 403 admin forbidden does not log the user out.

## Product image fix

- Product image paths are normalized from `/public/...` or `public/...` to Vite-safe `/...` paths.
- If `mockupsByColor` exists, the frontend uses it.
- If `mockupsByColor` is missing but `mockups` exists, color mockups are generated from `mockups`.
- If backend image data is missing, the product falls back to local product-type mockups.
- Local T-shirt mock products now use existing `/mockups/tshirt/front.png`, `/back.png`, `/left.png`, and `/right.png` assets instead of missing color-folder assets.
- Product details and profile order previews prefer `screenshot3dUrl` and `previewUrl` before plain product images.

## Cart persistence fix

- Backend cart responses are normalized from nested and flat shapes.
- Cart item normalization preserves `productId`, `productType`, `title`, `name`, `price`, `quantity`, `size`, `color`, `image`, `previewUrl`, `screenshot3dUrl`, `customDesignId`, `usedPlacements`, `customDesignPlacements`, and customization flags.
- In backend mode, `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, item delete, and cart clear are attempted first.
- Successful backend cart reads/writes mirror normalized items to localStorage as a development fallback.
- If backend cart fails during development, localStorage fallback is used with a console warning instead of showing an empty cart.

## Payment provider fix

- Checkout shows both Monobank and LiqPay as selectable payment options.
- Order creation sends the selected provider as `paymentProvider: "monobank" | "liqpay"`.
- Payment creation sends `{ orderId, provider }`.
- Monobank endpoints are tried for Monobank payments.
- LiqPay endpoints are tried for LiqPay payments, with `/orders/:id/pay` as a shared fallback.
- If `paymentUrl` or `redirectUrl` is returned, the user is redirected.
- If no URL is returned, the mock-success path marks payment paid and opens the order.

## Endpoint fallbacks

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/profile`, fallback `PATCH /users/me`.
- Products: `GET /products`, `GET /products/:id`, `GET /categories`.
- Cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart`.
- Designs: `POST /custom-designs` -> `POST /designs`; `GET /custom-designs/product/:productId` -> `GET /designs/by-product/:productId`.
- Orders: `POST /orders`, `GET /orders/my` -> `GET /orders`, `GET /orders/:id`.
- Monobank payment: `/payments/monobank`, `/payments/monobank/create`, `/payments/monobank/create-invoice`, `/orders/:id/pay`.
- LiqPay payment: `/payments/liqpay`, `/payments/liqpay/create`, `/payments/liqpay/create-invoice`, `/orders/:id/pay`.
- Support: `POST /support/tickets` -> `POST /support`; `GET /support/tickets/my` -> `GET /support/my`; admin support aliases remain supported.

## Known limitations

- The repo currently contains T-shirt mockups at `/mockups/tshirt/*.png`, not `/mockups/tshirt/white/*.png`; the frontend uses the existing assets so images remain visible.
- Backend runtime behavior for register/login/cart persistence still depends on the separate backend exposing the compatible endpoints and database writes.
- Mock fallback remains available only when `VITE_USE_BACKEND=false` or as a local development fallback for non-auth data.

## Manual test checklist

- Register a new account and confirm the backend database receives the user.
- Log in with that user and reload the site; profile should remain authenticated via `/auth/me`.
- Click Admin as a non-admin; user should not be logged out.
- Open Catalog; T-shirt product images should be visible.
- Change color in ProductDetails; image gallery should remain visible.
- Open Customizer; 2D mockup and 3D preview should still work.
- Add a product/custom design to cart; refresh the page and confirm backend cart items remain.
- Checkout and confirm both Monobank and LiqPay are visible.
- Select each payment provider and confirm the provider is sent in the order/payment payload.
- Open Profile and Orders; previews should use customized screenshots when available.
- Create a support ticket in backend mode; no fake ticket should be created if backend fails.
- Run `npm run build`.
