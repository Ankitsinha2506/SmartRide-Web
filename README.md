# SmartRide Web Portal

Responsive React portal for SmartRide vendors and administrators. The app uses the existing Backend REST API and Socket.IO server.

## Roles and features

- Vendor: dashboard, vehicle inventory, bookings, notifications, reports, analytics, and profile.
- Admin: platform dashboard, customer/vendor/vehicle/booking/payment management, reports, analytics, notifications, and profile.
- Protected routes and role-aware navigation.
- Server-state caching with TanStack Query, authenticated Axios requests, form validation, charts, and live Socket.IO refreshes.

## Run locally

Requires Node.js 20.19+.

```sh
cp .env.example .env
npm install
npm run dev
```

The default API is `http://localhost:5000/api/v1`. Change `VITE_API_URL` and `VITE_SOCKET_URL` in `.env` when the backend uses another host.

## Quality checks

```sh
npm run lint
npm run build
```

## Structure

- `src/components`: shared layout and presentation components
- `src/features`: domain pages grouped by module
- `src/services`: REST and Socket.IO clients
- `src/store`: authenticated session state
- `src/config`: environment configuration

Use an HTTPS backend and production environment variables for deployment. The backend remains the source of truth for authorization; hiding a route in this client is not a security boundary.
