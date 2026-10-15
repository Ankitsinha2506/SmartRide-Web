# Implementation Plan — SmartRide Vendor Dashboard

> Project: `e:\Company Project\SmartRide\SmartRide-Web`
> Build: `npm run build` (Vite)
> Dev: `npm run dev`
> No test framework present — verification is via `npm run build` (zero errors) and manual browser smoke-test.

---

## Codebase findings (read before implementing)

- **Routing**: `App.jsx` uses React Router v7 flat `<Routes>`. Vendor routes live inside `<ProtectedRoute roles={['VENDOR']} />` block (line 5 of that block). Paths are relative (no leading slash needed on nested routes but existing entries use them — follow existing pattern).
- **API**: `src/services/api.js` — `api.get('/path')` returns `response.data.data` directly. `api.post/patch` same. No envelope wrapping needed in components.
- **State**: All pages use `@tanstack/react-query`. Query key `['vendor-vehicles']` and `['vendor-bookings']` are shared with DashboardPage — invalidation must use those keys.
- **CSS**: Everything lives in `src/App.css`. No CSS modules, no Tailwind. New classes appended at the bottom. Variables: `--lime:#C8F000`, `--text-primary:#111111`, `--border:#E8E8E8`, `--radius-card:16px`, `--radius-btn:100px`, `--card-shadow`, `--muted`, `--green:#146c5b`.
- **Components**: `StatusPill`, `FilterBar`, `Modal`, `PageState`, `StatCard` all exist and are stable — reuse without modification.
- **VehiclesPage**: Currently has a modal-based "Add vehicle" form. The plan replaces that with navigation to `/vehicles/add`. The existing edit modal (`editTarget`) **must be kept**.
- **DashboardPage**: `pending-item` rows show vehicle name + customer but lack booking code, time-ago, and amount. The CSS classes `pending-item`, `btn-accept`, `btn-decline` already exist.
- **BookingsPage**: Uses `<DataTable>` for all statuses. The plan adds a styled panel for PENDING bookings when `statusFilter === 'PENDING'` (vendor role only) while keeping DataTable for all other views.
- **No photo upload API confirmed** — the Photos step in the wizard will use a file `<input>` that stores files in component state; actual upload deferred (step shows UI with note that upload endpoint is `POST /vehicles/:id/photos` when ready).

---

- [ ] 1. **Append new CSS classes to `src/App.css`**

  Add all new CSS needed by items 2–6 so that subsequent steps can reference classes immediately. No existing rules are touched — append only.

  Classes to add:

  ```
  /* ── Add Vehicle Wizard ── */
  .wizard-layout            — flex column, gap 0, max-width 860px, margin auto
  .wizard-steps             — flex row, gap 0, margin-bottom 32px, border-bottom 1px solid var(--border)
  .wizard-step              — flex 1, display flex, flex-direction column, align-items center, gap 6px, padding 16px 8px, border-bottom 3px solid transparent, font-size 12px, font-weight 600, color var(--muted), cursor default
  .wizard-step--active      — border-bottom-color var(--lime), color var(--text-primary)
  .wizard-step--done        — border-bottom-color var(--green), color var(--green)
  .wizard-step__num         — width 28px, height 28px, border-radius 50%, background #eeeeee, color var(--muted), display grid, place-items center, font-size 12px, font-weight 800
  .wizard-step--active .wizard-step__num  — background var(--lime), color #111
  .wizard-step--done .wizard-step__num    — background var(--green), color white
  .wizard-body              — background white, border 1px solid var(--border), border-radius var(--radius-card), padding 28px, box-shadow var(--card-shadow)
  .wizard-nav               — display flex, justify-content space-between, align-items center, margin-top 24px
  .wizard-section-title     — font-size 16px, font-weight 700, margin 0 0 18px, color var(--text-primary)
  .wizard-field-grid        — display grid, grid-template-columns 1fr 1fr, gap 16px
  .wizard-field             — display flex, flex-direction column, gap 6px
  .wizard-field label       — font-size 12px, font-weight 700, color var(--text-primary), text-transform capitalize
  .wizard-field input, .wizard-field select, .wizard-field textarea — border 1px solid var(--border), border-radius 10px, padding 10px 12px, font-size 13px, width 100%, outline none, font-family inherit
  .wizard-field input:focus, .wizard-field select:focus, .wizard-field textarea:focus — border-color var(--green), box-shadow 0 0 0 3px rgba(20,108,91,.08)
  .wizard-field--full       — grid-column 1 / -1
  .wizard-review-row        — display flex, justify-content space-between, padding 12px 0, border-bottom 1px solid var(--border), font-size 13px
  .wizard-review-row:last-child — border-bottom none
  .wizard-review-label      — color var(--muted), font-weight 600
  .wizard-review-value      — font-weight 700, color var(--text-primary)
  .wizard-photo-drop        — border 2px dashed var(--border), border-radius var(--radius-card), min-height 160px, display flex, flex-direction column, align-items center, justify-content center, gap 10px, color var(--muted), cursor pointer, padding 24px
  .wizard-photo-drop:hover  — border-color var(--green), color var(--green)
  .wizard-photo-thumbs      — display flex, flex-wrap wrap, gap 10px, margin-top 14px
  .wizard-photo-thumb       — width 80px, height 80px, border-radius 10px, object-fit cover, border 1px solid var(--border)

  /* ── Fleet page (VehiclesPage) upgrades ── */
  .fleet-stats-row          — display grid, grid-template-columns repeat(4,1fr), gap 14px, margin-bottom 24px
  .fleet-stat               — background white, border 1px solid var(--border), border-radius var(--radius-card), padding 16px 18px, box-shadow var(--card-shadow)
  .fleet-stat__value        — font-size 24px, font-weight 800, color var(--text-primary), display block
  .fleet-stat__label        — font-size 11px, color var(--muted), font-weight 600
  .fleet-view-toggle        — display flex, gap 5px, margin-left auto, margin-bottom 18px
  .fleet-view-toggle button — width 34px, height 34px, border-radius 8px, display grid, place-items center, background white, border 1px solid var(--border), color var(--muted)
  .fleet-view-toggle button.active — background var(--lime), border-color var(--lime), color #111
  .vehicle-card--list       — display flex, flex-direction row, align-items center, gap 0, border-radius var(--radius-card)
  .vehicle-card--list .vehicle-card__visual — width 120px, min-width 120px, height 90px, border-radius var(--radius-card) 0 0 var(--radius-card)
  .vehicle-card--list .vehicle-card__body  — flex 1, padding 12px 16px
  .vehicle-card__reg-badge  — display inline-flex, padding 3px 8px, border-radius 6px, background #f0f0f0, color var(--text-primary), font-size 10px, font-weight 700, letter-spacing 0.5px, margin-left 6px
  .vehicle-card--list .vehicle-card__actions — margin-top 0

  /* ── Booking row (Figma Pending Approval style) ── */
  .booking-rows             — display flex, flex-direction column, gap 0
  .booking-row              — display flex, align-items center, gap 16px, padding 16px 0, border-bottom 1px solid var(--border)
  .booking-row:last-child   — border-bottom none
  .booking-row__avatar      — width 40px, height 40px, border-radius 12px, background var(--lime), color #111, display grid, place-items center, font 700 16px 'Inter', flex-shrink 0
  .booking-row__main        — flex 1, min-width 0
  .booking-row__name        — font-size 14px, font-weight 700, color var(--text-primary), white-space nowrap, overflow hidden, text-overflow ellipsis
  .booking-row__sub         — font-size 12px, color var(--muted), margin-top 2px, white-space nowrap, overflow hidden, text-overflow ellipsis
  .booking-row__meta        — display flex, align-items center, gap 6px, margin-top 4px
  .booking-row__code        — font-size 11px, font-weight 700, color var(--green), background #ddf1eb, border-radius 6px, padding 2px 7px
  .booking-row__ago         — font-size 11px, color var(--muted)
  .booking-row__amount      — font-size 15px, font-weight 800, color var(--text-primary), white-space nowrap
  .booking-row__actions     — display flex, gap 8px, flex-shrink 0
  ```

  Files: `src/App.css`

  Verify: `npm run build` — exits 0, no CSS parse errors.

---

- [ ] 2. **Create `AddVehiclePage.jsx` — 6-step wizard at `/vehicles/add`**

  Create a new page component. This is a full-page wizard (not a modal). Uses a single `useState` form object initialized with the same `initial` shape already used in VehiclesPage, extended with `features: []` and `photos: []` (for state only, not sent to API until upload endpoint is ready).

  **Component structure:**

  ```jsx
  // src/features/vehicles/AddVehiclePage.jsx

  import { useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { useMutation, useQueryClient } from '@tanstack/react-query'
  import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
  import { api } from '../../services/api'

  const STEPS = ['Basic Info', 'Pricing', 'Features', 'Location', 'Photos', 'Review']

  const initial = {
    category: 'SEDAN', brand: '', model: '', registrationNumber: '',
    year: new Date().getFullYear(), color: '', description: '',
    pricePerDay: '', securityDeposit: '', fuelType: 'PETROL',
    transmission: 'MANUAL', seats: 5, mileage: 0,
    features: [],          // string[] – amenity checkboxes
    city: '', state: '', address: '',
    photos: [],            // File[] – stored in state, not sent to create API
  }

  export function AddVehiclePage() { ... }
  ```

  **Step rendering** — a `renderStep(step)` function returns JSX for each step index:

  - **Step 0 — Basic Info**: Fields `brand`, `model`, `category` (select: BIKE/SCOOTER/HATCHBACK/SEDAN/SUV/LUXURY), `year`, `registrationNumber`, `color`, `fuelType` (select), `transmission` (select), `seats` (number), `description` (textarea, full-width). Use `wizard-field-grid` grid, `wizard-field` per field, `wizard-field--full` on description.

  - **Step 1 — Pricing**: Fields `pricePerDay` (number, required), `securityDeposit` (number, optional), a read-only calculated row showing "Per hour (estimated)" = pricePerDay / 8. All in a single-column layout inside `wizard-field-grid`.

  - **Step 2 — Features**: A checkbox grid of common vehicle features: `['Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging', 'Sunroof', 'Backup Camera', 'Child Seat', 'Spare Tyre', 'First Aid Kit', 'Dash Cam']`. Toggling a checkbox adds/removes the string from `form.features` array. Display as a 2-column checkbox grid.

  - **Step 3 — Location**: Fields `city` (required), `state` (required), `address` (full-width textarea, optional). Use `wizard-field-grid`.

  - **Step 4 — Photos**: A `<div className="wizard-photo-drop">` containing an `<input type="file" accept="image/*" multiple hidden>` triggered by clicking the div. Shows thumbnails of selected files using `URL.createObjectURL`. Note below: "Photos will be uploaded after vehicle is created." Use `wizard-photo-thumbs` for previews.

  - **Step 5 — Review**: Render a summary table using `wizard-review-row` / `wizard-review-label` / `wizard-review-value` for every field that has a value. Group by section: Basic Info, Pricing, Features, Location.

  **Navigation**: Back/Next buttons in `.wizard-nav`. "Next" validates the current step (simple required-field check: if required fields for that step are empty, show an inline `<div className="form-error">` and do not advance). "Submit" appears instead of "Next" on step 5.

  **Required field validation per step:**
  - Step 0: `brand`, `model`, `registrationNumber`
  - Step 1: `pricePerDay` must be > 0
  - Step 2, 3 (location): `city`, `state`
  - Steps 2, 4: no required fields
  - Step 5: always valid (review only)

  **Submit logic:**

  ```js
  const qc = useQueryClient()
  const navigate = useNavigate()

  const create = useMutation({
    mutationFn: () => api.post('/vehicles', {
      category: form.category,
      brand: form.brand,
      model: form.model,
      registrationNumber: form.registrationNumber,
      city: form.city,
      fuelType: form.fuelType,
      transmission: form.transmission,
      seats: Number(form.seats),
      pricePerDay: Number(form.pricePerDay),
      description: form.description,
      year: form.year ? Number(form.year) : undefined,
      color: form.color || undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      // securityDeposit, features, state, address passed if backend accepts them:
      securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
      features: form.features.length ? form.features : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-vehicles'] })
      navigate('/vehicles')
    },
  })
  ```

  **Page heading** (above wizard):

  ```jsx
  <div className="page-heading">
    <div>
      <span className="eyebrow">Fleet management</span>
      <h1>Add a vehicle</h1>
      <p>Fill in the details to list your vehicle on SmartRide.</p>
    </div>
    <button className="secondary-button primary-button--fit" onClick={() => navigate('/vehicles')}>
      <ChevronLeft size={16} /> Cancel
    </button>
  </div>
  ```

  Files: `src/features/vehicles/AddVehiclePage.jsx`

  Verify: `npm run build` — exits 0.

---

- [ ] 3. **Update `App.jsx` — add `/vehicles/add` route**

  Add the import and route. The route goes inside the existing `<ProtectedRoute roles={['VENDOR']} />` block, as a sibling of the existing `<Route path="vehicles" ...>`.

  **Import to add** (with the other feature imports):
  ```js
  import { AddVehiclePage } from './features/vehicles/AddVehiclePage'
  ```

  **Route to add** inside `<ProtectedRoute roles={['VENDOR']} />`:
  ```jsx
  <Route path="vehicles/add" element={<AddVehiclePage />} />
  ```

  Place it immediately before or after `<Route path="vehicles" element={<VehiclesPage />} />` — before is fine.

  Files: `src/App.jsx`

  Verify: `npm run build` — exits 0. Navigate to `/vehicles/add` in browser and the wizard page renders (not a 404).

---

- [ ] 4. **Update `VehiclesPage.jsx` — replace modal-add with navigation, add fleet stats row, view toggle, enhanced cards**

  **Changes:**

  a. **Add `useNavigate` import** and import `LayoutGrid`, `List` from lucide-react. Add `view` state: `const [view, setView] = useState('grid')`.

  b. **Remove the `modal` state and `create` mutation** entirely — the add action now navigates to `/vehicles/add`. Keep `editTarget`, `form`, `update`, `availability` as-is.

  c. **Replace the "Add vehicle" button** onClick from `() => setModal(true)` to `() => navigate('/vehicles/add')`.

  d. **Add a fleet stats mini-cards row** below `<div className="page-heading">` and above `<FilterBar>`:

  ```jsx
  <div className="fleet-stats-row">
    <div className="fleet-stat">
      <span className="fleet-stat__value">{allVehicles.length}</span>
      <span className="fleet-stat__label">Total Vehicles</span>
    </div>
    <div className="fleet-stat">
      <span className="fleet-stat__value">{allVehicles.filter(v => v.isAvailable).length}</span>
      <span className="fleet-stat__label">Available</span>
    </div>
    <div className="fleet-stat">
      <span className="fleet-stat__value">{allVehicles.filter(v => !v.isAvailable && v.isApproved).length}</span>
      <span className="fleet-stat__label">On Rent</span>
    </div>
    <div className="fleet-stat">
      <span className="fleet-stat__value">{allVehicles.filter(v => !v.isApproved).length}</span>
      <span className="fleet-stat__label">Maintenance</span>
    </div>
  </div>
  ```

  e. **Add filter tabs** — expand existing `filterOptions` to include `{ value: 'INACTIVE', label: 'Inactive' }` (vehicles where `!v.isAvailable && !v.isApproved`). Add the filter case in the `filtered` computation:
  ```js
  if (statusFilter === 'INACTIVE') return !v.isAvailable && !v.isApproved
  ```

  f. **Add grid/list view toggle** between `<FilterBar>` and `<PageState>`:
  ```jsx
  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
    <div className="fleet-view-toggle">
      <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={16} /></button>
      <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={16} /></button>
    </div>
  </div>
  ```

  g. **Update vehicle card rendering** — add `vehicle-card--list` class when `view === 'list'`:
  ```jsx
  <article className={`vehicle-card${view === 'list' ? ' vehicle-card--list' : ''}`} key={v._id || v.id}>
  ```
  Inside the card body `<small>`, wrap the registration number in the reg-badge:
  ```jsx
  <small>{v.category} · {v.seats} seats <span className="vehicle-card__reg-badge">{v.registrationNumber}</span></small>
  ```

  h. **Remove the Add Vehicle `<Modal>` block** (the `{isOpen && <Modal ...>}` JSX at the bottom that handles the create form). The edit modal remains: keep the `{!!editTarget && <Modal ...>}` block, just change the condition from `isOpen` to `!!editTarget`.

  i. **Update `isOpen` reference** — replace `const isOpen = modal || !!editTarget` with nothing (delete it). Change the modal JSX condition to `{!!editTarget && ...}`.

  Files: `src/features/vehicles/VehiclesPage.jsx`

  Verify: `npm run build` — exits 0. In browser: fleet page shows 4 stat cards, filter tabs include Inactive, toggle switches between grid and list layout, "Add vehicle" button navigates to `/vehicles/add`.

---

- [ ] 5. **Update `DashboardPage.jsx` — improve pending approval rows with booking code, time-ago, and amount**

  **Add `formatTimeAgo` helper** at the top of the file (before the component):

  ```js
  function formatTimeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }
  ```

  **Replace the `.pending-list` JSX** (the `{pendingBookings.map(b => (...))}` block) with the new Figma-styled row. The new structure uses `.booking-rows` and `.booking-row`:

  ```jsx
  <div className="booking-rows">
    {pendingBookings.length === 0 && (
      <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No pending bookings</p>
    )}
    {pendingBookings.map(b => {
      const customerName = b.customer?.name || 'Customer'
      const vehicleLabel = b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'
      const dateRange = `${new Date(b.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} – ${new Date(b.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`
      const amount = b.pricing?.totalAmount ? `₹${b.pricing.totalAmount.toLocaleString('en-IN')}` : '—'
      const initial = customerName.charAt(0).toUpperCase()
      return (
        <div className="booking-row" key={b._id || b.id}>
          <div className="booking-row__avatar">{initial}</div>
          <div className="booking-row__main">
            <div className="booking-row__name">{customerName}</div>
            <div className="booking-row__sub">{vehicleLabel} · {dateRange}</div>
            <div className="booking-row__meta">
              <span className="booking-row__code">{b.bookingCode || `BK-${(b._id || b.id || '').slice(-6).toUpperCase()}`}</span>
              <span className="booking-row__ago">{formatTimeAgo(b.createdAt)}</span>
            </div>
          </div>
          <div className="booking-row__amount">{amount}</div>
          <div className="booking-row__actions">
            <button className="btn-accept" onClick={() => bookingAction.mutate({ id: b._id || b.id, action: 'confirm' })}>Accept</button>
            <button className="btn-decline" onClick={() => bookingAction.mutate({ id: b._id || b.id, action: 'cancel' })}>Decline</button>
          </div>
        </div>
      )
    })}
  </div>
  ```

  Change the wrapping `<div className="pending-list">` to `<div className="booking-rows">` (or just replace the inner map — either works, the CSS for `.booking-rows` is new from step 1).

  Files: `src/features/dashboard/DashboardPage.jsx`

  Verify: `npm run build` — exits 0. In browser: pending approval panel shows customer avatar initial, bold name, vehicle + date sub-line, booking code badge, time-ago, amount on right, Accept/Decline buttons.

---

- [ ] 6. **Update `BookingsPage.jsx` — add styled Pending panel for vendor role**

  Keep the existing DataTable for all non-pending views. When `statusFilter === 'PENDING'` **and** `role === 'VENDOR'`, render the styled `.booking-rows` list instead of the DataTable.

  **Add `formatTimeAgo` helper** at the top of the file (identical to the one in DashboardPage):

  ```js
  function formatTimeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }
  ```

  **Replace the `<article className="panel">` content block** with a conditional:

  ```jsx
  <article className="panel">
    <PageState loading={query.isLoading} error={query.error} empty={!filtered.length}>
      {statusFilter === 'PENDING' && role === 'VENDOR' ? (
        <div className="booking-rows">
          {filtered.map(b => {
            const customerName = b.customer?.name || 'Customer'
            const vehicleLabel = b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'
            const dateRange = `${new Date(b.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} – ${new Date(b.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`
            const amount = b.pricing?.totalAmount ? `₹${b.pricing.totalAmount.toLocaleString('en-IN')}` : '—'
            const initial = customerName.charAt(0).toUpperCase()
            return (
              <div className="booking-row" key={b._id || b.id}>
                <div className="booking-row__avatar">{initial}</div>
                <div className="booking-row__main">
                  <div className="booking-row__name">{customerName}</div>
                  <div className="booking-row__sub">{vehicleLabel} · {dateRange}</div>
                  <div className="booking-row__meta">
                    <span className="booking-row__code">{b.bookingCode || `BK-${(b._id || b.id || '').slice(-6).toUpperCase()}`}</span>
                    <span className="booking-row__ago">{formatTimeAgo(b.createdAt)}</span>
                  </div>
                </div>
                <div className="booking-row__amount">{amount}</div>
                <div className="booking-row__actions">
                  <button className="btn-accept" onClick={e => { e.stopPropagation(); action.mutate({ id: b._id || b.id, name: 'confirm' }) }}>Accept</button>
                  <button className="btn-decline" onClick={e => { e.stopPropagation(); action.mutate({ id: b._id || b.id, name: 'cancel' }) }}>Decline</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />
      )}
    </PageState>
  </article>
  ```

  Files: `src/features/bookings/BookingsPage.jsx`

  Verify: `npm run build` — exits 0. In browser: switching to "Pending" tab in Bookings shows the styled booking rows; switching to any other tab shows the regular DataTable.

---

## Dependency order

```
Step 1 (CSS)  →  Step 2 (AddVehiclePage, references CSS classes)
Step 1 (CSS)  →  Step 4 (VehiclesPage, references CSS classes)
Step 1 (CSS)  →  Step 5 (DashboardPage, references CSS classes)
Step 1 (CSS)  →  Step 6 (BookingsPage, references CSS classes)
Step 2        →  Step 3 (App.jsx imports AddVehiclePage)
```

Steps 4, 5, 6 are independent of each other and of Step 2/3. They can be implemented in any order after Step 1 is done.

---

## API payload notes

- `POST /vehicles` — existing endpoint used by VehiclesPage's create mutation. Payload shape is confirmed in VehiclesPage: `{ category, brand, model, registrationNumber, city, fuelType, transmission, seats (number), pricePerDay (number), description, year (number|undefined), color (undefined if blank), mileage (number|undefined) }`. AddVehiclePage extends this with `securityDeposit` and `features` — if the backend ignores unknown fields, these are harmless; if it rejects them, the wizard must omit them. The plan sends them with `undefined` coercion so `axios` strips undefined keys automatically.
- `PATCH /bookings/:id/confirm` and `PATCH /bookings/:id/cancel` — used in existing code, no changes.
- Photo upload: `POST /vehicles/:id/photos` is the expected future endpoint. The Photos wizard step stores files in `form.photos` state only; no upload call is made on vehicle create. A TODO comment in the component notes this.
