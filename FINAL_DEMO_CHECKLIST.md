# Solution Frontend MVP Demo Checklist

## Checkout Demo Flow

1. Clear mock data if a clean demo is needed:
   - `solution_cart`
   - `solution_orders`
   - `solution_support_tickets`
   - `solution_mock_designs`
   - `token`
   - `user`
2. Log in with a mock user account, for example `user@test.com / user123`.
3. Add a product to the cart from Product Details, or create a customized product through the Product Customizer and add it to cart.
4. Open `/checkout`.
5. Submit without required fields to verify validation:
   - first name
   - last name
   - phone
   - email
   - city
   - warehouse / branch
   - payment method
6. Fill all required fields and select Monobank or LiqPay.
7. Click `Pay and place order`.
8. Expected result:
   - mock order is created;
   - order is saved to `localStorage.solution_orders`;
   - mock payment is marked as paid;
   - cart is cleared from `localStorage.solution_cart`;
   - header cart badge updates to `0`;
   - user is redirected to `/orders/:orderId`.

## Orders Demo Flow

1. Before checkout, `/orders` should show:
   - `No orders yet`
   - `Your orders will appear here after checkout.`
   - `Go to catalog`
2. After checkout, `/orders` should show the created order.
3. Open the order details page.
4. Verify the order includes:
   - order number / id;
   - date;
   - customer data;
   - products;
   - size and color;
   - payment status;
   - order status;
   - delivery status;
   - empty tracking number until admin adds it.
5. For customized products, verify:
   - customized preview is visible when available;
   - `customDesignId` is preserved;
   - `usedPlacements` are visible when present.

## Profile Demo Flow

1. Before checkout, Profile recent orders should show an empty state.
2. After checkout, Profile recent orders should show the newly created order.
3. Profile editing remains separate from order creation and uses mock auth storage.

## Support Demo Flow

1. Before creating a ticket, `/support` should show:
   - `No support requests yet`
   - `Your support requests will appear here after you submit a ticket.`
2. Submit a support request with:
   - subject;
   - optional order number;
   - message.
3. Expected result:
   - ticket is created with status `new`;
   - ticket is saved to `localStorage.solution_support_tickets`;
   - ticket appears in the user Support page;
   - ticket appears in Admin Support.

## Admin Demo Flow

1. Log in as admin:
   - `admin@solution.com / admin123`
2. Open `/admin`.
3. Before checkout, Dashboard should show:
   - total orders: `0`;
   - paid orders: `0`;
   - in production: `0`;
   - shipped orders: `0`;
   - total revenue: `0`;
   - recent orders empty state.
4. After checkout, Dashboard should update from `localStorage.solution_orders`.
5. Open `/admin/orders`.
6. Verify created orders appear and customized order data is visible:
   - customized preview;
   - `customDesignId`;
   - size and color;
   - used placements;
   - placement metadata when present.
7. Admin can update:
   - order status;
   - tracking number.
8. Open `/admin/support`.
9. Verify created support tickets appear.
10. Admin can update support ticket status:
   - `new`;
   - `in_progress`;
   - `resolved`.
11. Admin exit controls:
   - `Back to store` navigates to `/` and keeps the user logged in;
   - `Logout` clears mock auth session and redirects to `/login`.

## LocalStorage Keys

- `solution_cart`: mock cart items.
- `solution_orders`: mock checkout-created orders.
- `solution_support_tickets`: mock support tickets.
- `solution_mock_designs`: saved custom designs.
- `solution_admin_products`: admin-created or edited products.
- `solution_deleted_products`: product ids hidden after admin deletion.
- `token`: mock JWT token.
- `user`: mock authenticated user.

## Known Limitations

- Payments are mock-only; no real Monobank or LiqPay API is connected.
- Nova Poshta tracking is mock-only; shipment creation is not implemented.
- Orders and support tickets are stored in browser localStorage, so data is browser-specific.
- Admin dashboard reflects local mock storage, not a backend database.
- Large 3D/customizer bundles trigger a Vite chunk-size warning during production build.
