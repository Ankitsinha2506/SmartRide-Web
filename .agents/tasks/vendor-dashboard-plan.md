# Vendor Dashboard — Implementation Plan

**Project:** `e:\Company Project\SmartRide\SmartRide-Web`  
**Stack:** Vite + React 19, React Router v7, TanStack Query v5, Zustand v5, Recharts v3, Lucide React, custom CSS (App.css only — no Tailwind)  
**Build:** `npm run build` · **Dev:** `npm run dev` · **Lint:** `npm run lint`  
**No new npm packages permitted.**

Order is bottom-up: utility UI components → page feature components → routes → CSS.  
Every step leaves the app in a buildable state. Items that are independent are noted.

---

## Step 1 — Create `Modal.jsx` (new reusable component)

**What:** A generic backdrop + centered-card wrapper. Renders a fixed backdrop overlay, traps the modal card in the centre, and exposes `onClose`, `title`, and `children` props. Use the existing `.modal-backdrop`, `.modal`, `.modal__header` CSS classes already in App.css — no new CSS needed for the wrapper itself.  
Use `useEffect` to add/remove `overflow:hidden` on `document.body` while open, and listen for `Escape` keydown to call `onClose`.

**File to create:**  
`src/components/ui/Modal.jsx`

```
Props: { title, eyebrow, onClose, children }
```

- Render: `<div className="modal-backdrop">` containing `<div className="modal">` with a `modal__header` (eyebrow + title + close button using `<X>` from lucide-react) and `{children}`.
- Export named: `export function Modal({ title, eyebrow, onClose, children })`

**Verify:** `npm run build` — zero errors. No tests exist; visual check in dev server.

---

## Step 2 — Create `FilterBar.jsx` (new reusable component)

**What:** A tab-style filter row. Accepts `tabs` (array of `{ key, label, count? }`) and `active` + `onChange` props. Uses existing `.tabs` CSS class already in App.css. Renders a count badge inline if `count` is provided (wrap in a `<small>` inside the button). Export named.

**File to create:**  
`src/components/ui/FilterBar.jsx`

```
Props: { tabs: [{ key, label, count }], active, onChange }
```

- Renders `<div className="tabs">` with one `<button>` per tab; active tab gets `className="active"`.

**Verify:** `npm run build` — zero errors.

---

## Step 3 — Add CSS for new UI patterns (App.css additions)

**What:** Append new CSS rule-sets to the end of `App.css`. Do **not** remove or modify any existing rule. Add the following groups:

### 3a — Sidebar enhancements
```css
/* sidebar section label */
.sidebar-section-label { ... }
/* sidebar active left-border accent */
.sidebar nav a.active { ... }    /* extend existing — add left-border accent */
/* sidebar user info footer */
.sidebar-user { ... }
```

Specifics:
- `.sidebar-section-label`: `font-size:10px; text-transform:uppercase; letter-spacing:1.3px; color:#4d7a70; font-weight:700; padding:18px 13px 6px; display:block;`
- Override `.sidebar nav a.active` to also add `border-left:3px solid #2ca68e; padding-left:10px;` (reduce left padding by 3px to compensate so text doesn't shift: `padding:11px 13px 11px 10px`).
- `.sidebar-user`: `margin-top:auto; padding:14px 13px 0; border-top:1px solid #1d493f; display:flex; align-items:center; gap:10px;`
- `.sidebar-user__avatar`: `width:36px; height:36px; border-radius:10px; background:#2ca68e; color:white; display:grid; place-items:center; font-weight:800; font-size:14px; flex-shrink:0;`
- `.sidebar-user__info small`: `font-size:10px; color:#4d7a70; display:block;`
- `.sidebar-user__info strong`: `font-size:13px; color:#d9e9e5;`

### 3b — Earnings page
```css
.earnings-grid { ... }            /* 3-col stat row */
.earnings-breakdown { ... }       /* panel + table combo */
```
- `.earnings-grid`: same as `.stats-grid` but 3 columns: `display:grid; grid-template-columns:repeat(3,1fr); gap:17px; margin-bottom:18px;`
- No unique breakdown style needed — reuse `.panel` + `table`.

### 3c — Settings page
```css
.settings-grid { ... }
.settings-card { ... }
.settings-card__header { ... }
.toggle-row { ... }
.toggle-switch { ... }
.toggle-switch input { ... }
.toggle-switch__track { ... }
.toggle-switch input:checked + .toggle-switch__track { ... }
.toggle-switch__thumb { ... }
.toggle-switch input:checked ~ .toggle-switch__thumb { ... }
```

Specifics:
- `.settings-grid`: `display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:8px;`
- `.settings-card`: same visual as `.panel` — `background:white; border:1px solid var(--line); border-radius:18px; padding:24px; box-shadow:0 8px 30px rgba(31,63,53,.035);`
- `.settings-card__header`: `display:flex; align-items:center; gap:10px; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--line);`
- `.settings-card__header h3`: `margin:0; font-size:16px;`
- `.toggle-row`: `display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f3f2;`
- `.toggle-row:last-child`: `border-bottom:none;`
- `.toggle-switch`: `position:relative; width:42px; height:24px; flex-shrink:0;`
- `.toggle-switch input`: `opacity:0; width:0; height:0; position:absolute;`
- `.toggle-switch__track`: `position:absolute; inset:0; background:#d8e4e0; border-radius:999px; transition:.2s; cursor:pointer;`
- `.toggle-switch input:checked + .toggle-switch__track`: `background:#2ca68e;`
- `.toggle-switch__thumb`: `position:absolute; left:3px; top:3px; width:18px; height:18px; border-radius:50%; background:white; transition:.2s; pointer-events:none;`
- `.toggle-switch input:checked ~ .toggle-switch__thumb` (sibling combinator, needs wrapper — simplify: use `input:checked + .toggle-switch__track::after` pseudo approach instead): use `::after` on the track for the thumb.

Revised toggle approach (simpler, no extra element):  
`.toggle-switch__track`: add `display:block; position:relative;` — and `::after` pseudo for the circle.  
`.toggle-switch__track::after`: `content:''; position:absolute; left:3px; top:3px; width:18px; height:18px; border-radius:50%; background:white; transition:.2s;`  
`.toggle-switch input:checked + .toggle-switch__track::after`: `left:calc(100% - 21px);`

### 3d — Filter bar count badge
```css
.filter-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; border-radius:999px; background:#e0eeea; color:#146c5b; font-size:10px; font-weight:800; margin-left:5px; padding:0 4px; }
.tabs button.active .filter-count { background:#ddf1eb; }
```

### 3e — Booking detail modal
```css
.booking-detail { display:grid; grid-template-columns:1fr 1fr; gap:0; }
.booking-detail__field { padding:14px 0; border-bottom:1px solid var(--line); }
.booking-detail__field:nth-child(odd) { padding-right:18px; }
.booking-detail__field label { font-size:11px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:.8px; display:block; margin-bottom:4px; }
.booking-detail__field span { font-size:14px; font-weight:600; color:#18211f; }
```

### 3f — Vehicle card edit button & image area improvements
```css
.vehicle-card__actions { display:flex; gap:8px; align-items:center; margin-top:12px; }
.vehicle-card__edit { background:#edf0ef; color:#56615e; border-radius:9px; padding:7px 10px; font-size:11px; font-weight:700; display:flex; align-items:center; gap:5px; }
.vehicle-card__edit:hover { background:#e0e8e5; }
```

### 3g — Chart container (for earnings/dashboard chart panels)
```css
.chart-panel { margin-top:18px; }
.chart-panel .panel__header { margin-bottom:10px; }
```

### 3h — Quick actions grid (dashboard)
```css
.quick-actions { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:18px; }
.quick-action-btn { background:white; border:1px solid var(--line); border-radius:14px; padding:16px; display:flex; flex-direction:column; align-items:flex-start; gap:8px; text-align:left; transition:box-shadow .15s; }
.quick-action-btn:hover { box-shadow:0 6px 24px rgba(20,108,91,.1); border-color:#b0d4cc; }
.quick-action-btn__icon { width:36px; height:36px; border-radius:10px; background:#ddf1eb; color:var(--green); display:grid; place-items:center; }
.quick-action-btn span { font-size:13px; font-weight:700; color:#18211f; }
.quick-action-btn small { font-size:11px; color:var(--muted); }
```

### 3i — Responsive additions
```css
@media(max-width:1100px){.earnings-grid{grid-template-columns:repeat(2,1fr)}.settings-grid{grid-template-columns:1fr}.quick-actions{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.earnings-grid{grid-template-columns:1fr}.quick-actions{grid-template-columns:1fr}}
```

**File to modify:**  
`src/App.css`

**Verify:** `npm run build` — zero errors. Visually confirm no existing styles are broken.

---

## Step 4 — Redesign `DashboardLayout.jsx`

**What:** Enhance the sidebar with the full vendor nav, section labels, an active left-border indicator, hover states, and a user-info footer above sign-out. Admin nav stays unchanged (add Profile link to admin nav too). Keep realtime toast, mobile overlay, and topbar as-is.

**File to modify:**  
`src/components/layout/DashboardLayout.jsx`

**Changes:**

1. Add new imports: `TrendingUp` (Earnings), `Settings` (Settings), `User` (Profile) from lucide-react. `BarChart2` already exists as `ChartNoAxesCombined`; use `BarChart2` for the vendor Analytics placeholder.

2. Replace `vendorLinks` array with grouped structure using section labels:
   ```js
   // Main section
   ["/", "Dashboard", LayoutDashboard],
   ["/vehicles", "My Fleet", CarFront],
   ["/bookings", "Bookings", ClipboardList],
   // Finance section  
   ["/earnings", "Earnings", TrendingUp],
   // Insights section (vendor-only placeholder)
   ["/analytics-vendor", "Analytics", BarChart2],   // placeholder route, renders coming-soon
   // Account section
   ["/profile", "Profile", User],
   ["/settings", "Settings", Settings],
   ```
   Store sections as a grouped array:
   ```js
   const vendorSections = [
     { label: 'Main', links: [["/","Dashboard",LayoutDashboard],["/vehicles","My Fleet",CarFront],["/bookings","Bookings",ClipboardList]] },
     { label: 'Finance', links: [["/earnings","Earnings",TrendingUp]] },
     { label: 'Account', links: [["/profile","Profile",User],["/settings","Settings",Settings]] },
   ]
   ```
   Analytics placeholder: add a non-link `<div>` styled like a nav link with a `Coming soon` badge — OR simply add it as a NavLink to `/analytics-vendor` that will show a page-state "Coming soon" message (handled in App.jsx via a simple inline component).

3. Render vendor nav by iterating `vendorSections`: for each section emit a `<span className="sidebar-section-label">{section.label}</span>` followed by the NavLinks.

4. Add `AdminLinks` section labels too (group: Main, Management, Intelligence). Same pattern.

5. Replace the bare `<button className="logout">` footer block with:
   ```jsx
   <div className="sidebar-user">
     <div className="sidebar-user__avatar">{user?.name?.[0] || 'S'}</div>
     <div className="sidebar-user__info">
       <strong>{user?.name || 'Vendor'}</strong>
       <small>{user?.role}</small>
     </div>
   </div>
   <button className="logout" onClick={...}><LogOut size={18}/> Sign out</button>
   ```
   Move `margin-top:auto` from `.logout` to `.sidebar-user` (already done via CSS in Step 3). Remove inline `margin-top:auto` from any JSX if present.

6. Keep the `end={to === "/"}` prop on the Dashboard NavLink so it doesn't stay "active" on all pages.

**Verify:** `npm run build` — zero errors. Open dev server, log in as vendor, confirm all 7 nav links render; active link has green left-border accent.

---

## Step 5 — Redesign `DashboardPage.jsx` (vendor section only)

**What:** Expand the vendor dashboard with: 4 revenue stat cards (Today / This Week / This Month / Total — all derived client-side from `bookings/vendor/me`), active bookings count, total/available vehicles stat, recent bookings list (keep existing), 30-day revenue area chart (client-side from bookings `completedAt` / `endDate`), and a quick-actions section. Admin dashboard section is **not changed**.

**File to modify:**  
`src/features/dashboard/DashboardPage.jsx`

**Changes — vendor branch only:**

1. Keep all existing imports; add `TrendingUp`, `Calendar`, `CheckCircle` from lucide-react; add `AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer` (already imported but guarded to admin — move imports outside the conditional).

2. Derive client-side metrics from `bookings` array (already fetched):
   ```js
   const now = new Date()
   const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
   const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - todayStart.getDay())
   const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

   const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
   const revenueTotal = completedBookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
   const revenueMonth = completedBookings.filter(b => new Date(b.endDate) >= monthStart).reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
   const revenueWeek = completedBookings.filter(b => new Date(b.endDate) >= weekStart).reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
   const revenueToday = completedBookings.filter(b => new Date(b.endDate) >= todayStart).reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
   const activeCount = bookings.filter(b => b.status === 'ACTIVE').length
   const availableVehicles = vehicles.filter(v => v.isAvailable).length
   ```

3. Replace the vendor `stats` array with 6 cards:
   - Today's Revenue, This Week, This Month, Total Revenue, Active Bookings, Available Vehicles.
   - Use existing `StatCard` component. Tones: mint, blue, amber, violet, mint, blue.

4. Build 30-day chart data client-side:
   ```js
   const chartData = Array.from({ length: 30 }, (_, i) => {
     const d = new Date(todayStart); d.setDate(d.getDate() - (29 - i))
     const label = d.toLocaleDateString('en-IN', { month:'short', day:'numeric' })
     const revenue = completedBookings
       .filter(b => { const bd = new Date(b.endDate); return bd >= d && bd < new Date(d.getTime() + 86400000) })
       .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
     return { date: label, revenue }
   })
   ```

5. Replace the vendor panel section with:
   - `<div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>` (override to 3-col for 6 cards, or use a wrapper; actually split into two rows: revenue row + operational row — use two `stats-grid` divs or override column count with inline style).
   - Revenue stats row (3 cards: Today, Week, Month) + a total card row (Total, Active bookings, Available vehicles) — keep 4-col grid, render 4 cards on first row, 2 on second (or use 6 in a 3-col grid, simpler: `grid-template-columns:repeat(3,1fr)`).
   - Use `className="stats-grid"` with inline override `{{gridTemplateColumns:'repeat(3,1fr)'}}` for 6 cards.

6. Below stats, render the `dashboard-grid` with two panels:
   - **Left panel:** 30-day revenue area chart using `AreaChart` with the `chartData`. Chart height 260px.
   - **Right panel:** Recent bookings list (existing `activity-list` pattern, 5 entries) + a "View all" link to `/bookings`.

7. Below `dashboard-grid`, add a quick-actions row using `.quick-actions` CSS class:
   - "Add Vehicle" → `navigate('/vehicles')` (shows the add modal — navigate and the page has the button)
   - "View Bookings" → `navigate('/bookings')`
   - "View Earnings" → `navigate('/earnings')`
   Each quick-action button: `.quick-action-btn` with icon, title span, small description.

8. Keep the `useNavigate` import — add `import { useNavigate } from 'react-router-dom'`.

**Verify:** `npm run build` — zero errors. Log in as vendor, dashboard shows 6 stat cards, chart, recent bookings, quick actions.

---

## Step 6 — Enhance `VehiclesPage.jsx`

**What:** Add edit vehicle modal, category/status filter bar, approval status badges, and an edit button on each vehicle card. Keep all existing create and toggle-availability functionality intact.

**File to modify:**  
`src/features/vehicles/VehiclesPage.jsx`

**Changes:**

1. Add imports: `Pencil` from lucide-react; `FilterBar` from `../../components/ui/FilterBar`; `Modal` from `../../components/ui/Modal`.

2. Expand the `initial` form state to include new fields:
   ```js
   const initial = {
     category:'SEDAN', brand:'', model:'', registrationNumber:'', city:'',
     fuelType:'PETROL', transmission:'MANUAL', seats:5, pricePerDay:1000,
     description:'', year: new Date().getFullYear(), color:'', mileage:0
   }
   ```

3. Add state: `const [editTarget, setEditTarget] = useState(null)` — when set, modal opens in edit mode.

4. Add `update` mutation:
   ```js
   const update = useMutation({
     mutationFn: ({ id, data }) => api.patch(`/vehicles/${id}`, data),
     onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-vehicles'] }); setEditTarget(null); setForm(initial) }
   })
   ```

5. Add filter state:
   ```js
   const [categoryFilter, setCategoryFilter] = useState('ALL')
   const [statusFilter, setStatusFilter] = useState('ALL')
   ```

6. Derive `filtered` list:
   ```js
   const filtered = (query.data || []).filter(v => {
     const catOk = categoryFilter === 'ALL' || v.category === categoryFilter
     const stOk = statusFilter === 'ALL'
       || (statusFilter === 'APPROVED' && v.isApproved)
       || (statusFilter === 'PENDING' && !v.isApproved)
       || (statusFilter === 'AVAILABLE' && v.isAvailable)
       || (statusFilter === 'UNAVAILABLE' && !v.isAvailable)
     return catOk && stOk
   })
   ```

7. Add filter UI above the grid:
   ```jsx
   <FilterBar
     tabs={[{key:'ALL',label:'All'},{key:'APPROVED',label:'Approved'},{key:'PENDING',label:'Pending'},{key:'AVAILABLE',label:'Available'},{key:'UNAVAILABLE',label:'Unavailable'}]}
     active={statusFilter}
     onChange={setStatusFilter}
   />
   ```
   Add a secondary category `<select>` (plain `<select>` styled inline) for category filter next to the FilterBar.

8. Add edit button to each vehicle card inside `.vehicle-card__actions`:
   ```jsx
   <div className="vehicle-card__actions">
     <button className="vehicle-card__edit" onClick={() => { setEditTarget(v); setForm({ ...initial, ...v }); }}>
       <Pencil size={13}/> Edit
     </button>
     <button className={`toggle ${v.isAvailable?'toggle--on':''}`} onClick={...}>
       <Power size={15}/>{v.isAvailable?'Available':'Paused'}
     </button>
   </div>
   ```
   Move the existing toggle button inside this `.vehicle-card__actions` div (remove it from its current location).

9. Replace the existing raw `modal-backdrop`/`form` modal with the new `<Modal>` component for both create and edit:
   ```jsx
   {(modal || editTarget) && (
     <Modal
       title={editTarget ? 'Edit vehicle' : 'Add a vehicle'}
       eyebrow={editTarget ? 'Update inventory' : 'New inventory'}
       onClose={() => { setModal(false); setEditTarget(null); setForm(initial); }}
     >
       <form onSubmit={e => { e.preventDefault(); editTarget ? update.mutate({ id: editTarget._id || editTarget.id, data: { ...form, seats: Number(form.seats), pricePerDay: Number(form.pricePerDay), year: Number(form.year), mileage: Number(form.mileage) } }) : create.mutate() }}>
         <div className="form-grid">
           {/* existing fields: brand, model, registrationNumber, city, pricePerDay, seats */}
           {/* new fields: description (full-width textarea), year, color, mileage */}
           {/* selects: category, fuelType, transmission */}
         </div>
         {(create.error || update.error) && <div className="form-error">{(create.error || update.error).message}</div>}
         <button className="primary-button">{(create.isPending || update.isPending) ? 'Saving…' : editTarget ? 'Save changes' : 'Create vehicle'}</button>
       </form>
     </Modal>
   )}
   ```

10. For the `description` field use a `<textarea>` spanning both columns (add a `form-grid__full` class or use `style={{gridColumn:'1/-1'}}`). For `year`, `color`, `mileage` add them to the existing `map` loop.

**Verify:** `npm run build` — zero errors. Open fleet page, confirm filter bar renders, edit button opens modal pre-filled with vehicle data, new fields visible.

---

## Step 7 — Enhance `BookingsPage.jsx`

**What:** Add status filter tabs and a booking detail modal (on row click). Keep all existing action buttons (Start rental, Complete, Assign driver) and admin/vendor role routing intact.

**File to modify:**  
`src/features/bookings/BookingsPage.jsx`

**Changes:**

1. Add imports: `useState` (already used? — check: not currently imported); `FilterBar` from `../../components/ui/FilterBar`; `Modal` from `../../components/ui/Modal`; `X` from lucide-react. Actually `useState` is not currently imported — add it.

2. Add state:
   ```js
   const [statusFilter, setStatusFilter] = useState('ALL')
   const [selected, setSelected] = useState(null)
   ```

3. Derive `filtered` list:
   ```js
   const allBookings = query.data || []
   const filtered = statusFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === statusFilter)
   ```

4. Add `FilterBar` above the panel:
   ```jsx
   <FilterBar
     tabs={[
       { key:'ALL', label:'All', count: allBookings.length },
       { key:'PENDING', label:'Pending', count: allBookings.filter(b=>b.status==='PENDING').length },
       { key:'CONFIRMED', label:'Confirmed', count: allBookings.filter(b=>b.status==='CONFIRMED').length },
       { key:'ACTIVE', label:'Active', count: allBookings.filter(b=>b.status==='ACTIVE').length },
       { key:'COMPLETED', label:'Completed', count: allBookings.filter(b=>b.status==='COMPLETED').length },
       { key:'CANCELLED', label:'Cancelled', count: allBookings.filter(b=>b.status==='CANCELLED').length },
     ]}
     active={statusFilter}
     onChange={setStatusFilter}
   />
   ```

5. Make rows clickable: add `onClick={() => setSelected(r)}` to the DataTable row. Since `DataTable` doesn't expose a `onRowClick` prop, add it:
   - Modify `DataTable.jsx` to accept optional `onRowClick` prop: `<tr key={...} onClick={() => onRowClick?.(row)} style={onRowClick ? {cursor:'pointer'} : {}}>`.

6. Render booking detail modal when `selected !== null`:
   ```jsx
   {selected && (
     <Modal title="Booking detail" eyebrow="Rental record" onClose={() => setSelected(null)}>
       <div className="booking-detail">
         <div className="booking-detail__field"><label>Booking code</label><span>{selected.bookingCode}</span></div>
         <div className="booking-detail__field"><label>Status</label><span><StatusPill value={selected.status}/></span></div>
         <div className="booking-detail__field"><label>Customer</label><span>{selected.customer?.name || '—'}</span></div>
         <div className="booking-detail__field"><label>Vehicle</label><span>{selected.vehicle ? `${selected.vehicle.brand} ${selected.vehicle.model}` : `${selected.customerVehicle?.make} ${selected.customerVehicle?.model}`}</span></div>
         <div className="booking-detail__field"><label>Start date</label><span>{new Date(selected.startDate).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span></div>
         <div className="booking-detail__field"><label>End date</label><span>{new Date(selected.endDate).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span></div>
         <div className="booking-detail__field"><label>Service type</label><span>{selected.serviceType?.replace('_',' ')}</span></div>
         <div className="booking-detail__field"><label>Driver</label><span>{selected.driver?.name || 'Not assigned'}</span></div>
         <div className="booking-detail__field" style={{gridColumn:'1/-1'}}><label>Amount</label><span style={{fontSize:'22px'}}>₹{selected.pricing?.totalAmount?.toLocaleString('en-IN')}</span></div>
       </div>
     </Modal>
   )}
   ```

7. Pass `filtered` (not `query.data`) to `DataTable`.

**Verify:** `npm run build` — zero errors. Click a booking row — modal opens with correct data. Filter tabs reduce the list.

---

## Step 8 — Create `EarningsPage.jsx`

**What:** New page at `src/features/earnings/EarningsPage.jsx`. Derives all data client-side from the existing `/bookings/vendor/me` endpoint (no new API needed). Shows: 3 summary stat cards (Total Earned, Pending, This Month), a 30-day bar chart, and a per-vehicle earnings breakdown table.

**File to create:**  
`src/features/earnings/EarningsPage.jsx`

**Implementation:**

```jsx
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../../services/api'
import { StatCard } from '../../components/ui/StatCard'
import { PageState } from '../../components/ui/PageState'
import { StatusPill } from '../../components/ui/StatusPill'
import { DataTable } from '../../components/ui/DataTable'
```

**Derived metrics (same pattern as DashboardPage Step 5):**
- `completedBookings` → filter `status === 'COMPLETED'`
- `pendingBookings` → filter `status === 'PENDING' || status === 'CONFIRMED' || status === 'ACTIVE'` — these represent pending earnings
- `totalEarned` = sum of `pricing.totalAmount` from completedBookings
- `pendingEarned` = sum of `pricing.totalAmount` from pendingBookings
- `monthEarned` = sum from completedBookings where `endDate >= monthStart`

**30-day chart data:** same `Array.from({length:30})` approach as DashboardPage — bar chart (use `<BarChart>` following the pattern in `AnalyticsPage.jsx`).

**Per-vehicle breakdown table** — derived by grouping `completedBookings` by `vehicle._id`:
```js
const vehicleMap = {}
completedBookings.forEach(b => {
  const key = b.vehicle?._id || b.vehicle?.id || 'unknown'
  if (!vehicleMap[key]) vehicleMap[key] = {
    vehicleId: key,
    name: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Unknown vehicle',
    bookings: 0, revenue: 0
  }
  vehicleMap[key].bookings++
  vehicleMap[key].revenue += b.pricing?.totalAmount || 0
})
const vehicleRows = Object.values(vehicleMap).sort((a,b) => b.revenue - a.revenue)
```

**Columns for DataTable:**
- Vehicle name, Bookings count, Revenue (formatted ₹), Avg per booking.

**Layout:**
```jsx
<div className="earnings-grid">
  <StatCard icon={IndianRupee} label="Total earned" value={`₹${totalEarned.toLocaleString('en-IN')}`} hint="Completed rentals" tone="mint" />
  <StatCard icon={Clock} label="Pending earnings" value={`₹${pendingEarned.toLocaleString('en-IN')}`} hint="Active & confirmed" tone="amber" />
  <StatCard icon={TrendingUp} label="This month" value={`₹${monthEarned.toLocaleString('en-IN')}`} hint="Current month" tone="blue" />
</div>

<div className="dashboard-grid">
  {/* Left: 30-day bar chart panel */}
  {/* Right: payment history list - last 10 completed bookings */}
</div>

<article className="panel" style={{marginTop:18}}>
  <div className="panel__header"><h3>Earnings by vehicle</h3></div>
  <DataTable columns={...} rows={vehicleRows} />
</article>
```

Payment history (right panel): list of last 10 completed bookings with bookingCode, vehicle, date, amount using `activity-list` pattern.

**Verify:** `npm run build` — zero errors. Navigate to `/earnings` as vendor, see 3 stat cards, chart, table.

---

## Step 9 — Create `SettingsPage.jsx`

**What:** New page at `src/features/settings/SettingsPage.jsx`. Static-first with a working change-password form (calls `api.post('/auth/change-password', {...})`) and toggle UI for notification preferences (client-side state only — no backend persistence needed for this iteration). Also shows account info and a business hours display section.

**File to create:**  
`src/features/settings/SettingsPage.jsx`

**Implementation details:**

```jsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Bell, Clock, User } from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
```

**Sections (2-column settings-grid):**

1. **Change Password card** (`.settings-card`):
   - Form with 3 fields: Current password, New password, Confirm new password.
   - On submit: validate `newPassword === confirmPassword` client-side; call `api.post('/auth/change-password', { currentPassword, newPassword })`.
   - Use `react-hook-form` (already installed) with `useForm()` — consistent with the rest of the codebase's approach.
   - Success: show inline success message; error: show `.form-error`.
   - API endpoint assumption: `POST /auth/change-password` — if endpoint doesn't exist the form will show the API error gracefully.

2. **Notification Preferences card** (`.settings-card`):
   - 4 toggle rows using the CSS toggle-switch from Step 3: "New booking alerts", "Booking status updates", "Payout notifications", "Marketing updates".
   - Local `useState` for each (initialized `true` for first 3, `false` for marketing).
   - No API call — purely UI for this iteration. Add a comment: `// TODO: persist to /vendor/preferences when endpoint is available`.

3. **Account Info card** (`.settings-card`):
   - Read-only display of `user.name`, `user.email`, `user.role` from `useAuthStore`.
   - Link/button: "Edit profile" → `navigate('/profile')`.

4. **Business Hours card** (`.settings-card`):
   - Static display of standard business hours (Mon–Fri 9am–6pm, Sat 10am–4pm, Sun Closed).
   - Add a comment: `// TODO: make editable when vendor hours API is available`.

**Verify:** `npm run build` — zero errors. Navigate to `/settings`, confirm 4 cards render in 2-column layout, toggle switches are clickable.

---

## Step 10 — Update `App.jsx` (add routes + analytics vendor placeholder)

**What:** Add `/earnings` and `/settings` vendor-only routes. Add a minimal analytics placeholder for `/analytics-vendor`. No admin routes change.

**File to modify:**  
`src/App.jsx`

**Changes:**

1. Add imports:
   ```js
   import { EarningsPage } from './features/earnings/EarningsPage'
   import { SettingsPage } from './features/settings/SettingsPage'
   ```

2. Add a local inline placeholder component above `App`:
   ```jsx
   function VendorAnalyticsPlaceholder() {
     return (
       <div style={{padding:'60px 0',textAlign:'center'}}>
         <span className="eyebrow">Coming soon</span>
         <h1 style={{marginTop:12}}>Vendor Analytics</h1>
         <p className="muted">Detailed analytics for your fleet are on the way.</p>
       </div>
     )
   }
   ```

3. Inside the `<Route element={<ProtectedRoute roles={['VENDOR']} />}>` block, add:
   ```jsx
   <Route path="earnings" element={<EarningsPage />} />
   <Route path="settings" element={<SettingsPage />} />
   <Route path="analytics-vendor" element={<VendorAnalyticsPlaceholder />} />
   ```

4. The existing Profile route at `path="profile"` is already outside the vendor-only block (shared with admin) — leave it there. Settings/Earnings are vendor-only, so they go inside the existing `<ProtectedRoute roles={['VENDOR']}>` block.

**Verify:** `npm run build` — zero errors. Navigate to `/earnings`, `/settings`, `/analytics-vendor` as vendor — all render without 404 redirect.

---

## Step 11 — Final integration check

**What:** Run a full build and lint pass. Fix any import errors, prop-type mismatches, or CSS class typos discovered.

**Files potentially affected:** any file from Steps 1–10.

**Verify:**
1. `npm run build` — must exit 0 with no warnings about unresolved imports.
2. `npm run lint` — fix any oxlint errors (unused vars, missing keys, etc.).
3. Manual smoke test in dev server (`npm run dev`):
   - Log in as vendor → see 7 sidebar links with section labels.
   - Dashboard shows 6 stat cards + revenue chart + quick actions.
   - Fleet page: filter bar, edit button on each card, edit modal pre-fills.
   - Bookings: status tabs, row click opens detail modal.
   - Earnings: 3 stat cards, bar chart, vehicle breakdown table.
   - Settings: 4 cards, toggle switches functional.
   - Log in as admin → verify admin sidebar and all admin pages unchanged.

---

## File creation/modification summary

| # | File | Action |
|---|------|--------|
| 1 | `src/components/ui/Modal.jsx` | CREATE |
| 2 | `src/components/ui/FilterBar.jsx` | CREATE |
| 3 | `src/features/earnings/EarningsPage.jsx` | CREATE (new dir) |
| 4 | `src/features/settings/SettingsPage.jsx` | CREATE (new dir) |
| 5 | `src/App.css` | MODIFY — append new classes only |
| 6 | `src/components/ui/DataTable.jsx` | MODIFY — add `onRowClick` prop |
| 7 | `src/components/layout/DashboardLayout.jsx` | MODIFY — full sidebar redesign |
| 8 | `src/features/dashboard/DashboardPage.jsx` | MODIFY — vendor section only |
| 9 | `src/features/vehicles/VehiclesPage.jsx` | MODIFY — edit modal + filters |
| 10 | `src/features/bookings/BookingsPage.jsx` | MODIFY — filter tabs + detail modal |
| 11 | `src/App.jsx` | MODIFY — add 3 routes |

## Dependency order

```
Step 1 (Modal.jsx)
Step 2 (FilterBar.jsx)
   ↓
Step 3 (App.css — new classes)
   ↓
Step 4 (DashboardLayout — uses new CSS classes)
Step 5 (DashboardPage — uses new CSS classes)
Step 6 (VehiclesPage — uses Modal + FilterBar + new CSS)
Step 7 (BookingsPage — uses Modal + FilterBar + DataTable onRowClick)
   ↓
Step 8 (EarningsPage — uses StatCard, DataTable, PageState — no new deps)
Step 9 (SettingsPage — uses authStore, api — no new deps)
   ↓
Step 10 (App.jsx — imports EarningsPage + SettingsPage)
   ↓
Step 11 (Integration build + lint)
```

Steps 1 and 2 are independent and can be done in parallel. Steps 4 and 5 are independent once Step 3 is done. Steps 6, 7, 8, 9 are independent of each other once their deps (Steps 1–3) are done.

---

## Key patterns and constraints

- `api.get/post/patch` — always returns `response.data.data` (interceptor unwraps). No `.data` needed at call site.
- `useQuery` key arrays: match existing keys where data is shared (e.g., `['vendor-vehicles']`, `['vendor-bookings']` already used in DashboardPage).
- `v._id || v.id` — both ID forms exist in API responses; always use this pattern.
- `StatusPill` handles any string value by lowercasing — no changes needed for new statuses.
- All paths in JSX imports must be relative (e.g., `../../components/ui/Modal`).
- No `console.log` in new files — existing api.js already logs; don't add more.
- Admin routes and components (`AdminResourcePage`, `ReportsPage`, `AnalyticsPage`) are never imported into or modified by vendor feature files.
