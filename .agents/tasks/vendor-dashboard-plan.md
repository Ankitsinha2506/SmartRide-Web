# Vendor Dashboard Visual Rebuild — Implementation Plan

## Overview

Full visual restyle of the SmartRide vendor dashboard to match the Figma design:
dark (`#111111`) sidebar, lime (`#C8F000`) accent, Inter font, light gray page
background, black hero stat card, and all vendor pages restyled to match.
Admin pages must continue to work without visual regression.

Build command: `npm run build` (Vite)  
No new npm packages — use React, React Router, Tanstack Query, Lucide React,
Recharts, Zustand, Axios only.

---

## Files to Create

| Path | Purpose |
|---|---|
| `src/features/documents/DocumentsPage.jsx` | Placeholder vendor Documents page |

---

## Files to Rewrite / Modify

| Path | Change type |
|---|---|
| `src/index.css` | Font swap (Inter), keep CSS variables |
| `src/App.css` | Full rewrite — new variables + all classes |
| `src/components/layout/DashboardLayout.jsx` | New sidebar design, vendor info row, SWITCH ROLE section |
| `src/components/ui/StatCard.jsx` | Support `dark` tone (black hero card) + lime badge |
| `src/components/ui/StatusPill.jsx` | New color classes: `available`, `on_rent`, `maintenance` |
| `src/features/dashboard/DashboardPage.jsx` | New vendor layout with BarChart, fleet utilization, pending approvals |
| `src/features/vehicles/VehiclesPage.jsx` | Filter tabs remap + new card style |
| `src/features/bookings/BookingsPage.jsx` | Accept/Decline buttons for PENDING, new row style |
| `src/features/earnings/EarningsPage.jsx` | Switch AreaChart → BarChart, restyle stat cards |
| `src/features/profile/ProfilePage.jsx` | Restyle to new design system |
| `src/features/settings/SettingsPage.jsx` | Restyle cards + lime buttons |
| `src/App.jsx` | Add `/documents` route for VENDOR |

---

## Step-by-Step Plan

---

### 1 — Update `src/index.css`: swap font to Inter, keep root variables

**What to do:**  
Replace the `@import` line that loads `DM Sans` and `Manrope` with an Inter
import. Update `font-family` on `:root` to `'Inter', sans-serif`. Remove the
`font-family: 'Manrope'` override on `h1,h2,h3,strong` (Inter covers all
weights). Keep all existing CSS variables (`--green`, `--green-dark`, `--cream`,
`--line`, `--muted`, `--shadow`) unchanged so admin pages are unaffected.

**Files:** `src/index.css`

**Exact change:**
```css
/* OLD */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:...&family=Manrope:...&display=swap');
:root { font-family: 'DM Sans', sans-serif; ... }
h1,h2,h3,strong { font-family: 'Manrope', sans-serif }

/* NEW */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
:root { font-family: 'Inter', sans-serif; ... }
/* remove the Manrope override — Inter handles all weights */
```

**Verify:** `npm run build` — no errors.

---

### 2 — Rewrite `src/App.css`: new CSS variables, keep existing class names

**What to do:**  
Replace the entire `App.css` content. The new file must:

1. **Add new CSS variables** at the top (inside `:root` or as globals on `body`/`*`):
   ```css
   --sidebar-bg: #111111;
   --sidebar-text: #888888;
   --lime: #C8F000;
   --lime-dark: #a8cc00;
   --page-bg: #F5F5F5;
   --white: #FFFFFF;
   --text-primary: #111111;
   --text-secondary: #666666;
   --border: #E8E8E8;
   --card-shadow: 0 2px 8px rgba(0,0,0,0.06);
   --radius-card: 16px;
   --radius-btn: 100px;
   --sidebar-width: 210px;
   ```
   Keep these existing variables (used by admin pages):
   ```css
   --green: #146c5b;
   --green-dark: #0d4d42;
   --line: #e3e8e4;
   --muted: #6e7c77;
   --shadow: 0 18px 50px rgba(24,48,40,.08);
   ```

2. **Keep every existing CSS class name** — admin pages rely on `.stat-card`,
   `.panel`, `.dashboard-grid`, `.eyebrow`, `.vehicle-grid`, `.vehicle-card`,
   `.table-wrap`, `.tabs`, `.status`, `.modal`, `.modal-backdrop`, `.toast`,
   `.login-page`, `.profile-card`, `.settings-card`, `.toggle-switch`,
   `.filter-bar`, `.filter-bar__btn`, `.earnings-grid`, `.earnings-table-grid`,
   `.quick-actions`, `.activity-list`, `.booking-detail`, `.page-state`, etc.

3. **Restyle sidebar classes** for the new dark theme:
   ```css
   .sidebar {
     width: var(--sidebar-width); /* 210px, was 250px */
     background: var(--sidebar-bg); /* #111 */
     color: var(--sidebar-text);   /* #888 */
   }
   .sidebar nav a {
     color: var(--sidebar-text);
     border-radius: var(--radius-btn); /* pill shape */
   }
   .sidebar nav a.active {
     background: var(--lime);
     color: var(--text-primary); /* black on lime */
     border-left: none; /* remove old left-border active style */
   }
   ```
   Update `.main` and `.topbar` margins from `250px` → `210px`.

4. **Add vendor info row class** `.sidebar-vendor-info`:
   ```css
   .sidebar-vendor-info {
     display: flex; align-items: center; gap: 10px; padding: 16px 13px 0;
   }
   .sidebar-vendor-info__avatar {
     width: 36px; height: 36px; border-radius: 50%;
     background: var(--lime); color: #111; display: grid; place-items: center;
     font: 700 14px 'Inter'; flex-shrink: 0;
   }
   .sidebar-vendor-info__name { font-size: 13px; font-weight: 700; color: white; }
   .sidebar-vendor-info__role { font-size: 10px; color: var(--sidebar-text); }
   ```

5. **Restyle `.brand`** (sidebar logo):
   ```css
   .brand { font: 800 18px 'Inter'; color: white; }
   .brand > span { background: var(--lime); color: #111; border-radius: 10px; }
   ```

6. **Add section label style** (used by SWITCH ROLE):
   ```css
   .sidebar-section-label {
     font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
     color: #555; padding: 18px 13px 6px; display: block; text-transform: uppercase;
   }
   ```

7. **Restyle `.stat-card`** to use new design system:
   ```css
   .stat-card { border-radius: var(--radius-card); box-shadow: var(--card-shadow); border-color: var(--border); }
   .stat-card--dark { background: var(--text-primary); color: white; }
   .stat-card--dark p, .stat-card--dark small { color: #aaa; }
   .stat-card--dark strong { color: white; }
   .stat-card__badge {
     display: inline-flex; align-items: center; padding: 3px 8px;
     background: var(--lime); color: #111; border-radius: 100px;
     font-size: 11px; font-weight: 700; margin-left: 6px;
   }
   ```

8. **Add vendor dashboard layout classes:**
   ```css
   /* Dashboard two-column split */
   .vendor-dashboard-grid {
     display: grid; grid-template-columns: 65fr 35fr; gap: 18px; margin-top: 18px;
   }
   /* Fleet utilization progress bars */
   .utilization-bar { margin: 10px 0; }
   .utilization-bar__label {
     display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 5px;
   }
   .utilization-bar__track { height: 8px; border-radius: 100px; background: var(--border); overflow: hidden; }
   .utilization-bar__fill { height: 100%; border-radius: 100px; }
   .utilization-bar__fill--rent  { background: #4B8EF1; }
   .utilization-bar__fill--avail { background: var(--lime); }
   .utilization-bar__fill--maint { background: #FFB800; }
   /* Pending approval list */
   .pending-list > .pending-item {
     display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border);
   }
   .pending-item__info { flex: 1; }
   .pending-item__actions { display: flex; gap: 8px; }
   .btn-accept {
     background: var(--lime); color: #111; font-weight: 700; font-size: 12px;
     padding: 7px 14px; border-radius: var(--radius-btn);
   }
   .btn-decline {
     background: #f5f5f5; color: #666; font-weight: 700; font-size: 12px;
     padding: 7px 14px; border-radius: var(--radius-btn); border: 1px solid var(--border);
   }
   ```

9. **Add new status pill colors** (without removing existing `.status--*` classes):
   ```css
   .status--available  { background: var(--lime); color: #111; }
   .status--on_rent    { background: #1a2e4a; color: white; }
   .status--maintenance { background: #FF9800; color: white; }
   ```

10. **Update `.primary-button`** to use lime:
    ```css
    .primary-button { background: var(--lime); color: #111; border-radius: var(--radius-btn); }
    .primary-button:hover { background: var(--lime-dark); }
    ```
    Keep `.secondary-button`, `.table-action`, `.edit-button` unchanged.

11. **Update `.filter-bar` active state** to use lime:
    ```css
    .filter-bar__btn--active { color: #111; background: white; }
    /* keep shadow */
    ```

12. **Update `.page-heading`** background stays transparent (uses `--page-bg` from body).

13. **Update `body` background** to `var(--page-bg)` i.e. `#F5F5F5`.

14. **Keep all responsive `@media` breakpoints** — just update pixel references from
    `250px` → `210px` where `.main { margin-left }` appears.

**Files:** `src/App.css`

**Verify:** `npm run build` — no errors. Load `/` in browser — sidebar is dark, active link has lime pill.

---

### 3 — Rewrite `src/components/layout/DashboardLayout.jsx`

**What to do:**  
Keep all logic (realtime socket, toast, mobile open/close, logout, NavLink
active). Change the JSX structure of `<aside>`:

**Brand row:**
```jsx
<div className="brand">
  <span><CarFront /></span>          {/* lime bg #C8F000 */}
  <div>SmartRide<small>Move smarter</small></div>
  <button className="mobile-close" onClick={() => setOpen(false)}><X /></button>
</div>
```
(unchanged — CSS now makes it white on dark bg)

**Vendor nav section (non-admin):**
Add a vendor info row ABOVE the `<nav>`:
```jsx
{!isAdmin && (
  <div className="sidebar-vendor-info">
    <div className="sidebar-vendor-info__avatar">
      {user?.name?.[0]?.toUpperCase() || 'V'}
    </div>
    <div>
      <div className="sidebar-vendor-info__name">{user?.name || 'Vendor'}</div>
      <div className="sidebar-vendor-info__role">Vendor</div>
    </div>
  </div>
)}
```

**Add Documents link** to `vendorSections`:
```js
const vendorSections = [
  {
    label: 'VENDOR',
    links: [
      ['/', 'Dashboard', LayoutDashboard],
      ['/vehicles', 'My Fleet', CarFront],
      ['/bookings', 'Bookings', ClipboardList],
      ['/earnings', 'Earnings', IndianRupee],
      ['/documents', 'Documents', FileText],   // NEW — import FileText from lucide-react
      ['/settings', 'Settings', Settings],
    ],
  },
];
```

**Add SWITCH ROLE section** at the bottom of vendor nav (display only — links are
`<span>` not `<a>` so they don't navigate):
```jsx
{!isAdmin && (
  <div>
    <span className="sidebar-section-label">SWITCH ROLE</span>
    <span className="sidebar-switch-link"><Users size={16}/> Customer</span>
    <span className="sidebar-switch-link"><IdCard size={16}/> Driver</span>
    <span className="sidebar-switch-link"><ShieldCheck size={16}/> Admin</span>
  </div>
)}
```
Add CSS for `.sidebar-switch-link`:
```css
.sidebar-switch-link {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 13px; color: #555; font-size: 13px; font-weight: 600; cursor: default;
}
```

**Import additions:** add `FileText` and `Users` to the lucide-react import. `IdCard` and `ShieldCheck` are already imported.

**Topbar:** keep unchanged (Bell, avatar, menu button).

**Footer:** keep `.sidebar-footer` unchanged (CSS now renders it on dark bg).

**Files:** `src/components/layout/DashboardLayout.jsx`

**Verify:** `npm run build` — no errors. Vendor sidebar shows dark bg + lime active pill + vendor info row + Documents link.

---

### 4 — Update `src/components/ui/StatCard.jsx`: add `dark` tone + badge

**What to do:**  
Accept a new optional `badge` prop and support `tone="dark"` which triggers the
black hero card style:
```jsx
export function StatCard({ icon: Icon, label, value, hint, tone = 'mint', badge }) {
  const isDark = tone === 'dark'
  return (
    <article className={`stat-card${isDark ? ' stat-card--dark' : ''}`}>
      <div className={`stat-card__icon stat-card__icon--${isDark ? 'dark' : tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>
          {value}
          {badge && <span className="stat-card__badge">{badge}</span>}
        </strong>
        <small>{hint}</small>
      </div>
    </article>
  )
}
```
Add CSS in App.css (done in step 2):
```css
.stat-card__icon--dark { background: #222; color: var(--lime); }
```

**Files:** `src/components/ui/StatCard.jsx`

**Verify:** `npm run build` — no errors.

---

### 5 — Update `src/components/ui/StatusPill.jsx`: add new vehicle status colors

**What to do:**  
The existing component already derives the CSS class from the value. The new CSS
classes (`.status--available`, `.status--on_rent`, `.status--maintenance`) added
in step 2 will automatically be picked up.

No JSX changes needed — only confirm that the class name generation:
```js
const key = String(value ?? 'UNKNOWN').toLowerCase()
// 'AVAILABLE' → 'status--available' ✓
// 'ON_RENT'   → 'status--on_rent'   ✓
// 'MAINTENANCE' → 'status--maintenance' ✓
```
works correctly. The string already does `.toLowerCase()` and the CSS uses those
exact keys. **No file change needed** — but verify the CSS was added in step 2.

**Files:** `src/components/ui/StatusPill.jsx` (no change — verification only)

**Verify:** `npm run build` — no errors.

---

### 6 — Rewrite `src/features/dashboard/DashboardPage.jsx`: new vendor layout

**What to do:**  
Keep the admin branch entirely unchanged. Rewrite only the **vendor return block**.
Keep all data-fetching hooks, derived variables (`completedBookings`,
`revenueMonth`, `chartData`, etc.) — only the JSX layout changes.

**New vendor layout structure:**

```
Page header row
  ├── Left: h1 "Vendor Dashboard", subtitle "{businessName} · KYC Verified ✓"
  └── Right: "+ Add Vehicle" lime pill button → navigate('/vehicles')

4-stat cards row (stats-grid)
  ├── [1] Total Vehicles   — white card, CarFront icon,  "{onRent} on rent" hint
  ├── [2] This Month Rev   — DARK card (tone="dark"), IndianRupee icon, badge="+14%" (static placeholder)
  ├── [3] Pending Requests — white card, ClipboardList icon, "Needs action" hint
  └── [4] Avg. Rating      — white card, Star icon, "4.8 · N reviews" hint (static 4.8)

vendor-dashboard-grid (65/35)
  ├── LEFT panel — Monthly Earnings BarChart
  │     header: "Monthly Earnings" + date range + total + %YTD badge
  │     BarChart: last 6 months from bookings data (or sample if empty)
  │     last bar fill: #111111, others: #D9D9D9
  └── RIGHT panel — Fleet Utilization
        On Rent progress bar (blue #4B8EF1)
        Available progress bar (lime #C8F000)
        Maintenance progress bar (orange #FFB800)
        "Overall utilization: XX%" footer

Pending Approval panel (full width)
  heading "Pending Approval" + count badge
  .pending-list: each PENDING booking → Accept / Decline buttons
  Accept calls: api.patch(`/bookings/${id}/confirm`)
  Decline calls: api.patch(`/bookings/${id}/cancel`)

My Fleet panel (full width)
  heading "My Fleet" + "+ Add Vehicle" link
  2-column vehicle-grid (capped to 4 vehicles, "View all" link)
```

**Data derivations to add:**
```js
const onRentCount = vehicles.filter(v => !v.isAvailable && v.isApproved).length
const maintenanceCount = 0  // no maintenance field in current API — use 0
const pendingBookings = bookings.filter(b => b.status === 'PENDING')

// 6-month bar chart data
const sixMonthData = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
  const nextD = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
  const label = d.toLocaleDateString('en-IN', { month: 'short' })
  const amount = completedBookings
    .filter(b => { const bd = new Date(b.endDate); return bd >= d && bd < nextD })
    .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  return { month: label, amount }
})
```

**BarChart import:** switch from `{ Area, AreaChart, ... }` to add `{ Bar, BarChart, Cell, ... }`.  
Recharts `BarChart` is already in the installed `recharts` package (v3.10.1 confirmed in package.json).

**Accept/Decline mutation:**
```js
const bookingAction = useMutation({
  mutationFn: ({ id, action }) => api.patch(`/bookings/${id}/${action}`),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['vendor-bookings'] })
    qc.invalidateQueries({ queryKey: ['vendor-vehicles'] })
  },
})
```
Accept: `bookingAction.mutate({ id, action: 'confirm' })`  
Decline: `bookingAction.mutate({ id, action: 'cancel' })`

**Imports to update:**
- Add: `Bar, BarChart, Cell` from `recharts`
- Add: `ClipboardList, Star, useQueryClient` 
- Keep: `CarFront, IndianRupee, useQueries, useQuery, PageState`
- Remove: `Area, AreaChart` (no longer used in vendor view — keep for admin AreaChart if admin still uses it, otherwise remove too). Check: admin view uses `AreaChart` — **keep** `Area, AreaChart` imports.

**Files:** `src/features/dashboard/DashboardPage.jsx`

**Verify:** `npm run build` — no errors. Vendor dashboard shows 4-stat row, 65/35 chart+utilization, pending list, fleet grid.

---

### 7 — Update `src/features/vehicles/VehiclesPage.jsx`: new filter tabs + card style

**What to do:**  

**Filter tabs remap** — replace the current 5 options with a design-aligned set:
```js
const filterOptions = [
  { value: 'ALL',         label: 'All' },
  { value: 'ON_RENT',     label: 'On Rent' },
  { value: 'AVAILABLE',   label: 'Available' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]
```
Filter logic (since vehicles have `isAvailable` but no `status` field):
```js
const filtered = allVehicles.filter(v => {
  if (statusFilter === 'ALL') return true
  if (statusFilter === 'ON_RENT')    return !v.isAvailable && v.isApproved
  if (statusFilter === 'AVAILABLE')  return v.isAvailable
  if (statusFilter === 'MAINTENANCE') return !v.isApproved  // use pending/unapproved as proxy
  return true
})
```

**Vehicle card status pill:** derive a display status for each vehicle:
```js
const vehicleStatus = (v) => {
  if (!v.isApproved) return 'MAINTENANCE'   // unapproved → maintenance color
  if (!v.isAvailable) return 'ON_RENT'
  return 'AVAILABLE'
}
// then: <StatusPill value={vehicleStatus(v)} />
```

**Card visual area** — keep `<CarFront size={44} />` but apply a subtle dark bg for
contrast (add CSS: `.vehicle-card__visual { background: #f0f0f0; }`).

**Add vehicle button** — already has `primary-button primary-button--fit`, which
the new CSS styles with lime background. No change needed.

**Edit and toggle buttons** — keep existing classes. CSS step 2 keeps `.edit-button`
and `.toggle`/`.toggle--on` styles.

**Files:** `src/features/vehicles/VehiclesPage.jsx`

**Verify:** `npm run build` — no errors. Filter tabs show On Rent / Available / Maintenance with correct counts.

---

### 8 — Update `src/features/bookings/BookingsPage.jsx`: Accept/Decline for PENDING

**What to do:**  
The existing page already uses `FilterBar`, `DataTable`, `StatusPill`, and a
booking detail `Modal`. Changes:

1. **Add Accept/Decline action buttons** in the `action` column render for
   `status === 'PENDING'` AND `role === 'VENDOR'`:
   ```js
   if (r.status === 'PENDING' && role === 'VENDOR')
     return (
       <div className="row-actions">
         <button className="btn-accept" onClick={e => { e.stopPropagation(); action.mutate({ id: r.id || r._id, name: 'confirm' }) }}>
           Accept
         </button>
         <button className="btn-decline" onClick={e => { e.stopPropagation(); action.mutate({ id: r.id || r._id, name: 'cancel' }) }}>
           Decline
         </button>
       </div>
     )
   ```
   Place this check BEFORE the existing `r.serviceType !== 'CAR_ONLY' && !r.driver`
   check so PENDING vendor bookings see Accept/Decline first.

2. **Accept/Decline in the modal** — add inside `<div className="modal-actions">`:
   ```jsx
   {selected.status === 'PENDING' && role === 'VENDOR' && (
     <>
       <button className="btn-accept" onClick={() => { action.mutate({ id: selected.id || selected._id, name: 'confirm' }); setSelected(null) }}>Accept</button>
       <button className="btn-decline" onClick={() => { action.mutate({ id: selected.id || selected._id, name: 'cancel' }); setSelected(null) }}>Decline</button>
     </>
   )}
   ```

3. **No other logic or query changes** — the existing `api.patch('/bookings/${id}/${name}')` mutation already handles `confirm` and `cancel` names.

**Files:** `src/features/bookings/BookingsPage.jsx`

**Verify:** `npm run build` — no errors. PENDING rows show lime Accept + gray Decline buttons.

---

### 9 — Update `src/features/earnings/EarningsPage.jsx`: BarChart + styled cards

**What to do:**  

1. **Switch chart from AreaChart to BarChart:**
   - Remove: `Area, AreaChart` imports from recharts
   - Add: `Bar, BarChart, Cell` imports from recharts
   - Replace the `<AreaChart>` JSX with:
     ```jsx
     <BarChart data={chartData} barSize={18}>
       <CartesianGrid strokeDasharray="3 3" vertical={false} />
       <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
       <YAxis tick={{ fontSize: 11 }} />
       <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
       <Bar dataKey="amount" radius={[4,4,0,0]}>
         {chartData.map((_, i) => (
           <Cell key={i} fill={i === chartData.length - 1 ? '#111111' : '#D9D9D9'} />
         ))}
       </Bar>
     </BarChart>
     ```
   This makes the last (most recent) bar dark `#111` and all others gray `#D9D9D9`.

2. **Stat cards** — the existing `StatCard` uses `.stat-card` which is already
   restyled in App.css (step 2). No prop changes needed.

3. **No data or query changes** — keep the same `chartData`, `vehicleMap`,
   `completedBookings` logic.

**Files:** `src/features/earnings/EarningsPage.jsx`

**Verify:** `npm run build` — no errors. Bar chart renders with gray bars and dark last bar.

---

### 10 — Rewrite `src/features/profile/ProfilePage.jsx`: new design system styles

**What to do:**  
The current file is heavily minified. Expand it and restyle:

1. **Profile hero** — change the gradient from `#133c33 → #1f705f` to `#111 → #222`
   to match the new dark theme. Update `.profile-avatar` background from `#f5c86b`
   to `var(--lime)` so the avatar is lime-colored.

2. **KYC Verified badge** — add a `✓ KYC Verified` inline indicator next to the
   business name using lime color:
   ```jsx
   <p>
     {p.businessName || 'Vendor'}
     {p.approvalStatus === 'APPROVED' && (
       <span style={{ marginLeft: 8, color: 'var(--lime)', fontWeight: 700, fontSize: 12 }}>
         ✓ KYC Verified
       </span>
     )}
   </p>
   ```

3. **Profile details section** — keep the 2-column grid layout and icons. Update
   icon colors to `var(--lime)` instead of `var(--green)`.

4. **ProfilePage** CSS: `.profile-hero` background is overridden in App.css for the
   new dark style. Update in App.css:
   ```css
   .profile-hero { background: linear-gradient(120deg, #111, #222); }
   .profile-avatar { background: var(--lime); color: #111; }
   ```

**Files:** `src/features/profile/ProfilePage.jsx`

**Verify:** `npm run build` — no errors. Profile hero shows dark bg, lime avatar.

---

### 11 — Update `src/features/settings/SettingsPage.jsx`: lime buttons

**What to do:**  
No logic changes. Two visual updates:

1. **Icon colors** — change `color="var(--green)"` on `<User>`, `<Lock>`, `<Bell>`
   to `color="var(--lime)"`. Since `var(--lime)` is now defined in App.css, this
   Just Works.

2. **"Change password" button** — currently `className="primary-button"` with an
   inline style override for `width: auto`. The `primary-button` class now renders
   lime automatically (step 2), so **only remove the inline `width` override** and
   let the class handle it:
   ```jsx
   <button className="primary-button primary-button--fit" type="submit">
   ```

3. **"Edit profile" button** — currently `className="secondary-button primary-button--fit"`.
   Keep it — secondary-button stays white/bordered per CSS.

4. **Toggle switches** — the `.toggle-switch` CSS uses `var(--green)` for the
   checked state. In App.css (step 2) add:
   ```css
   .toggle-switch input:checked + .toggle-switch__track { background: var(--lime); }
   ```
   (overrides the admin-era `var(--green)` — this is intentional for vendor pages;
   admin doesn't use toggle switches so no regression.)

**Files:** `src/features/settings/SettingsPage.jsx`

**Verify:** `npm run build` — no errors. Toggle tracks are lime when active.

---

### 12 — Create `src/features/documents/DocumentsPage.jsx`

**What to do:**  
Create a simple placeholder page that will be shown when the vendor navigates to
`/documents`:

```jsx
import { FileText } from 'lucide-react'

export function DocumentsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Compliance</span>
          <h1>Documents</h1>
          <p>Manage your KYC documents and vehicle registration papers.</p>
        </div>
      </div>
      <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <FileText size={48} color="var(--lime)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>Documents coming soon</h3>
        <p className="muted">
          Document upload and verification will be available in a future update.
        </p>
      </div>
    </>
  )
}
```

**Files:** `src/features/documents/DocumentsPage.jsx` (create new)

**Verify:** `npm run build` — no errors.

---

### 13 — Update `src/App.jsx`: add `/documents` route for VENDOR

**What to do:**  
Add the DocumentsPage import and route inside the existing `<ProtectedRoute roles={['VENDOR']}>` block.

**Import to add:**
```js
import { DocumentsPage } from './features/documents/DocumentsPage'
```

**Route to add** inside the VENDOR ProtectedRoute (alongside `/vehicles`, `/bookings`, `/earnings`, `/settings`):
```jsx
<Route path="documents" element={<DocumentsPage />} />
```

Also confirm that `/earnings` and `/settings` routes are present — they already exist in the current file. No other changes needed.

**Files:** `src/App.jsx`

**Verify:** `npm run build` — no errors. Navigating to `/documents` renders the placeholder page.

---

## CSS Variables Summary

New variables added to `App.css`:

```css
--sidebar-bg: #111111;
--sidebar-text: #888888;
--lime: #C8F000;
--lime-dark: #a8cc00;
--page-bg: #F5F5F5;
--white: #FFFFFF;
--text-primary: #111111;
--text-secondary: #666666;
--border: #E8E8E8;
--card-shadow: 0 2px 8px rgba(0,0,0,0.06);
--radius-card: 16px;
--radius-btn: 100px;
--sidebar-width: 210px;
```

Preserved admin-era variables (not changed):

```css
--green: #146c5b;
--green-dark: #0d4d42;
--line: #e3e8e4;
--muted: #6e7c77;
--shadow: 0 18px 50px rgba(24,48,40,.08);
```

---

## Recharts / Lucide Import Reference

### Recharts (v3.10.1 — already installed)

| Page | Components used |
|---|---|
| DashboardPage (admin) | `Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis` |
| DashboardPage (vendor) | `Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis` |
| EarningsPage | `Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis` |

### Lucide React (v1.33.0 — already installed)

New icon added in DashboardLayout: `FileText` (for Documents link).  
All other icons already imported: `CarFront, ClipboardList, IndianRupee, LayoutDashboard, Settings, UserCircle, Users, ShieldCheck, IdCard, Bell, LogOut, Menu, X, ChartNoAxesCombined`.

---

## Implementation Order (dependency chain)

```
1. index.css (font)
2. App.css (variables + classes)  ← steps 3-11 depend on CSS classes
3. StatCard.jsx (new tone prop)
4. DashboardLayout.jsx (new sidebar)
5. DashboardPage.jsx (vendor view)
6. VehiclesPage.jsx
7. BookingsPage.jsx
8. EarningsPage.jsx
9. ProfilePage.jsx
10. SettingsPage.jsx
11. DocumentsPage.jsx (new file)
12. App.jsx (new route)
```

---

## Build Verification Steps

Run after ALL items are complete:

```bash
# From e:\Company Project\SmartRide\SmartRide-Web
npm run build
```

Expected output:
- Zero TypeScript/ESLint errors
- `dist/` folder generated successfully
- No unresolved imports warnings

**Manual smoke checks after `npm run dev`:**

| Route | Check |
|---|---|
| `/` (vendor) | Dark sidebar, lime active pill, 4-stat cards, 65/35 chart layout |
| `/` (admin) | Admin sidebar still dark, overview stats unchanged |
| `/vehicles` | On Rent / Available / Maintenance filter tabs, lime pill Add button |
| `/bookings` | PENDING rows show lime Accept + gray Decline buttons |
| `/earnings` | BarChart with gray/dark bars, stat cards visible |
| `/profile` | Dark hero gradient, lime avatar |
| `/settings` | Lime toggle switches, lime Change Password button |
| `/documents` | Placeholder page renders, no 404 |

---

## Assumptions & Notes

1. **KYC status**: `p.approvalStatus === 'APPROVED'` is used to show "KYC Verified ✓".
   If the API returns a different field name, the condition should be updated.

2. **Maintenance filter**: Vehicles have no `status: 'MAINTENANCE'` field in the
   current API — `!v.isApproved` is used as a proxy. When the API gains a
   maintenance status field, the filter logic in VehiclesPage should be updated.

3. **Accept/Decline endpoints**: The plan uses `PATCH /bookings/:id/confirm` and
   `PATCH /bookings/:id/cancel` — these match the existing `action.mutate({ id, name })` 
   mutation shape already in BookingsPage. If the backend uses different endpoint
   names (e.g. `accept`, `reject`), update the `name` values accordingly.

4. **Avg. Rating stat**: No rating endpoint exists for vendors. Use static `4.8`
   as placeholder text in the stat card value.

5. **`+14%` badge on revenue card**: This is a static placeholder. When a trends
   API endpoint is available for vendors, replace with a computed value.

6. **Admin pages**: The admin sidebar uses the same `.sidebar` CSS class, so it
   will also become dark `#111`. This matches the design spec which explicitly
   calls for `#111111` for BOTH admin and vendor sidebar backgrounds.
