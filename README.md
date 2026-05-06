# Solution Frontend MVP

Solution is a React/Vite frontend for a MERN diploma project: an online clothing store where users can choose products, upload custom designs, place orders, and track delivery in mock mode.

## MVP Functionality

- Product catalog with search, filters, sorting, and product details.
- 2D mock product customizer with image upload, design positioning controls, save design, and add to cart.
- Cart with quantity updates, item removal, customized preview, and checkout link.
- Checkout with contact data, Nova Poshta delivery fields, Monobank/LiqPay mock payment selection, and order creation.
- Mock payment flow: pending, success, failed.
- User profile, user orders, order details, and mock Nova Poshta tracking by TTN.
- Support request form and user support ticket list.
- Admin dashboard, products CRUD, orders management, and support ticket status management.
- Mock auth with user/admin roles.

## Not Included In MVP

- Google login.
- Wishlist/favorites.
- Live chat.
- 3D preview.
- Promo codes.
- Recommendation system.
- Real backend integration.
- Real payment API integration.
- Real Nova Poshta API integration or shipment creation.

## Technologies Used

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS utility classes
- Lucide React icons
- Sonner toast notifications
- localStorage/sessionStorage mock persistence

## Folder Structure

```txt
src/app
  components/      Shared UI components
  layouts/         Root and admin layouts
  mocks/           Mock products, orders, cart, support tickets, admin stats
  pages/           Public, user, payment, and admin pages
  routes/          ProtectedRoute and AdminRoute
  services/        API client and feature services
  store/           Auth and cart contexts
  types/           Shared TypeScript types
```

## How To Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Create `.env` if needed:

```env
VITE_API_URL=http://localhost:5000/api
```

If `VITE_API_URL` is not set, the frontend falls back to `http://localhost:5000/api`.

## Mock Mode

Mocks are located in:

```txt
src/app/mocks
```

Services are located in:

```txt
src/app/services
```

The backend is not connected yet. Services return mock data and use `localStorage` / `sessionStorage` for MVP persistence:

- auth session and user data
- cart items
- created orders
- support tickets
- admin-created products
- mock payment state
- saved custom designs

This keeps the frontend ready for future API integration while allowing the MVP to work locally.

## Main Pages

- `/` Home
- `/catalog` Catalog
- `/product/:id` Product details
- `/customize/:id` Product customizer
- `/cart` Cart
- `/checkout` Checkout
- `/payment/pending` Payment pending
- `/payment/success` Payment success
- `/payment/failed` Payment failed
- `/profile` Profile
- `/orders` User orders
- `/orders/:orderId` Order details
- `/support` Support
- `/admin` Admin dashboard
- `/admin/products` Admin products
- `/admin/orders` Admin orders
- `/admin/support` Admin support

## Test Credentials

Mock login accepts any valid email and password.

- User: `user@test.com` / `user123`
- Admin: `admin@solution.com` / `admin123`

Any email containing `admin` gets the admin role in mock mode.

## Next Steps

- Build the backend API.
- Connect MongoDB.
- Replace mock services with real API calls.
- Add real Monobank/LiqPay payment integration.
- Add real Nova Poshta API tracking and shipment creation.
