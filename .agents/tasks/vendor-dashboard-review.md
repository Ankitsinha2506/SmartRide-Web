# Vendor dashboard expansion: Earnings, Settings, enhanced Fleet and Bookings

The vendor side of the dashboard was a stub. This change fills it out: four new pages (Earnings, Settings, plus substantive rewrites of DashboardPage and VehiclesPage/BookingsPage), two reusable components (Modal and FilterBar), route additions in App.jsx, and a large CSS extension. All revenue and booking metrics are derived client-side from the single `/bookings/vendor/me` endpoint, which is confirmed unbounded (no pagination) at the backend. The admin branch is structurally untouched. Watch for: a new queryKey inconsistency between BookingsPage and the rest of the vendor pages; and the Modal component missing ARIA dialog attributes needed for screen reader correctness.

**Verdict**: APPROVED

---

## High-level view

The vendor DashboardPage fetches `/vehicles/vendor/me` and `/bookings/vendor/me` and derives all stat cards, the 30-day chart, and quick-action hints in the browser. EarningsPage shares the `['vendor-bookings']` queryKey with DashboardPage, so both pages use the same TanStack Query cache entry with no double fetch. BookingsPage, however, uses a separate `['operations-bookings', role]` key for the same `/bookings/vendor/me` endpoint — these two caches stay independent, so a booking state-transition on BookingsPage (start, complete) does not update the stat cards or revenue chart visible on DashboardPage until the vendor re-navigates. Whether that stale-data window is acceptable is a product call, not a blocker.

The vehicle update mutation was previously confirmed broken (`api.put` against a `PATCH`-only route). It now correctly calls `api.patch`. The change-password form now has a valid backend counterpart — `PUT /auth/change-password` with `authMiddleware` and `changePasswordSchema` validation is present in `auth.routes.js`. Notification toggle state is persisted to `localStorage` keyed by user ID, resolving the prior silent-discard behavior.

All new vendor routes (`/earnings`, `/settings`) are nested inside the `ProtectedRoute roles={['VENDOR']}` block in App.jsx. The admin block — `AdminResourcePage`, `ReportsPage`, `AnalyticsPage` — is unchanged. CSS additions append new class blocks after the existing rules with no deletions.

---

<details>
<summary>Issues (2)</summary>

1. **Dual queryKey for the same bookings endpoint** — BookingsPage uses `['operations-bookings', role]` while DashboardPage and EarningsPage both use `['vendor-bookings']` for the same `GET /bookings/vendor/me` call. A booking status change from the BookingsPage mutation (`invalidateQueries(['operations-bookings', role])`) does not refresh the Dashboard or Earnings cache. Revenue figures on those pages go stale until the vendor re-visits them. Unify the queryKey or add a cross-key invalidation in the mutation's `onSuccess`.

2. **Modal missing ARIA dialog role** — `Modal.jsx` sets `overflow: hidden` on the body and handles Escape/backdrop-click correctly, but renders without `role="dialog"` and `aria-modal="true"`. Screen readers won't announce the layer as a dialog or trap virtual cursor navigation inside it. Add both attributes to the modal `div`.

</details>

---

<details>
<summary>Details</summary>

## Dual queryKey for vendor bookings

DashboardPage and EarningsPage query under `['vendor-bookings']`:

```js
// DashboardPage
{ queryKey: ['vendor-bookings'], queryFn: () => api.get('/bookings/vendor/me'), enabled: !admin }
// EarningsPage
{ queryKey: ['vendor-bookings'], queryFn: () => api.get('/bookings/vendor/me') }
```

BookingsPage uses a different key:

```js
{ queryKey: ['operations-bookings', role], queryFn: () => api.get(role === 'ADMIN' ? '/admin/bookings' : '/bookings/vendor/me') }
```

The action mutation invalidates only `['operations-bookings', role]`. So when a vendor completes a booking from the BookingsPage table, the completion is reflected in the table immediately, but the "Total earned" and "This month" stat cards on DashboardPage still show pre-completion numbers until the vendor navigates away and back (triggering a fresh fetch). For a vendor who bounces between the two pages during an active shift, this is a visible inconsistency. The fix is to add `qc.invalidateQueries({ queryKey: ['vendor-bookings'] })` alongside the existing invalidation in BookingsPage's `onSuccess`, or to consolidate both pages onto a single queryKey.

## Modal accessibility gap

`Modal.jsx` renders as:

```jsx
<div className="modal--wide" onClick={e => e.stopPropagation()}>
```

Without `role="dialog"` and `aria-modal="true"`, ARIA-aware assistive technologies traverse the full DOM rather than constraining focus to the modal content. Adding these two attributes is a two-line change and brings the component in line with WAI-ARIA dialog pattern requirements. Focus trapping (cycling Tab within the modal) is not implemented either, but that is a more involved enhancement.

</details>

---

<details>
<summary>Files changed</summary>

- `src/components/layout/DashboardLayout.jsx` — grouped vendor nav with section labels and user-info footer
- `src/components/ui/Modal.jsx` — new generic backdrop + card modal component
- `src/components/ui/FilterBar.jsx` — new tab-style filter bar with dual prop interface (`options/value` or `tabs/active`)
- `src/features/dashboard/DashboardPage.jsx` — vendor branch rewritten: 4 stat cards, 30-day area chart, recent bookings panel, quick actions
- `src/features/vehicles/VehiclesPage.jsx` — filter bar, edit modal with description/year/color/mileage fields, edit button per card
- `src/features/bookings/BookingsPage.jsx` — status filter bar, booking detail modal on row click
- `src/features/earnings/EarningsPage.jsx` — new: 4 summary stat cards, 30-day area chart, per-vehicle breakdown table, recent payments list
- `src/features/settings/SettingsPage.jsx` — new: account info, change-password form (backed by `PUT /auth/change-password`), notification toggles with localStorage persistence
- `src/App.jsx` — added `/earnings` and `/settings` inside the VENDOR ProtectedRoute block
- `src/App.css` — extended with sidebar footer, filter bar, quick actions, earnings grid, settings stack, toggle switch, booking detail modal, vehicle card actions, responsive breakpoints

Full diff: `git diff main -- src/`
</details>
