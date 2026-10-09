import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarFront, ClipboardCheck, ClipboardList, IndianRupee, Pencil, Star, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { StatCard } from '../../components/ui/StatCard'
import { StatusPill } from '../../components/ui/StatusPill'
import { PageState } from '../../components/ui/PageState'

const vehicleStatus = (v) => !v.isApproved ? 'MAINTENANCE' : !v.isAvailable ? 'ON_RENT' : 'AVAILABLE'

export function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const admin = user?.role === 'ADMIN'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const analytics = useQuery({ queryKey: ['analytics-dashboard'], queryFn: () => api.get('/analytics/dashboard'), enabled: admin })
  const trends = useQuery({ queryKey: ['analytics-trends'], queryFn: () => api.get('/analytics/trends?days=30'), enabled: admin })
  const vendor = useQueries({
    queries: [
      { queryKey: ['vendor-vehicles'], queryFn: () => api.get('/vehicles/vendor/me'), enabled: !admin },
      { queryKey: ['vendor-bookings'], queryFn: () => api.get('/bookings/vendor/me'), enabled: !admin },
    ]
  })

  const loading = admin ? analytics.isLoading : vendor.some(q => q.isLoading)
  const data = analytics.data || {}
  const vehicles = vendor[0]?.data || []
  const bookings = vendor[1]?.data || []

  // --- Admin stats ---
  const adminStats = [
    [Users, 'Active users', data.users || 0, 'Across the platform', 'mint'],
    [CarFront, 'Active vehicles', data.vehicles || 0, 'Approved inventory', 'blue'],
    [ClipboardCheck, 'Bookings', data.bookings || 0, `${data.activeBookings || 0} active now`, 'amber'],
    [IndianRupee, 'Captured revenue', `₹${Number(data.revenue || 0).toLocaleString('en-IN')}`, 'All time', 'violet'],
  ]

  // --- Vendor derived metrics ---
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
  const revenueMonth = completedBookings
    .filter(b => new Date(b.endDate) >= monthStart)
    .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)

  const onRentCount = vehicles.filter(v => !v.isAvailable && v.isApproved).length
  const availableCount = vehicles.filter(v => v.isAvailable).length
  const maintenanceCount = vehicles.filter(v => !v.isApproved).length
  const pendingBookings = bookings.filter(b => b.status === 'PENDING')

  // 6-month bar chart data
  const sixMonthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const nextD = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      amount: completedBookings
        .filter(b => { const bd = new Date(b.endDate); return bd >= d && bd < nextD })
        .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0),
    }
  })

  // Month range label for chart header
  const chartRangeLabel = sixMonthData.length > 0
    ? `${sixMonthData[0].month} – ${sixMonthData[sixMonthData.length - 1].month} ${now.getFullYear()}`
    : ''

  // Fleet utilization percentages
  const totalVehicles = vehicles.length || 1
  const rentPct = Math.round((onRentCount / totalVehicles) * 100)
  const availPct = Math.round((availableCount / totalVehicles) * 100)
  const maintPct = Math.round((maintenanceCount / totalVehicles) * 100)
  const utilizationPct = vehicles.length > 0 ? Math.round((onRentCount / vehicles.length) * 100) : 0

  // Booking action mutation
  const bookingAction = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/bookings/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-bookings'] })
      qc.invalidateQueries({ queryKey: ['vendor-vehicles'] })
    },
  })

  if (admin) {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <h1>Good day, {user?.name?.split(' ')[0] || 'Admin'}.</h1>
            <p>Here is what is happening across your SmartRide workspace.</p>
          </div>
        </div>
        <PageState loading={loading}>
          <div className="stats-grid">
            {adminStats.map(([Icon, label, value, hint, tone]) => (
              <StatCard key={label} icon={Icon} label={label} value={value} hint={hint} tone={tone} />
            ))}
          </div>
          <div className="dashboard-grid">
            <article className="panel panel--wide">
              <div className="panel__header">
                <div><span className="eyebrow">Performance</span><h3>Booking activity</h3></div>
              </div>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.data?.bookings || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#146c5b" fill="#d7eee8" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="panel">
              <div className="panel__header">
                <div><span className="eyebrow">Attention</span><h3>Quick summary</h3></div>
              </div>
              <div className="summary-ring">
                <strong>{data.vendorsPending || 0}</strong>
                <span>vendors awaiting approval</span>
              </div>
              <p className="muted">Review pending items regularly to keep the marketplace moving smoothly.</p>
            </article>
          </div>
        </PageState>
      </>
    )
  }

  // VENDOR VIEW
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Vendor</span>
          <h1>Vendor Dashboard</h1>
          <p>{user?.name} · <span style={{ color: 'var(--lime)', fontWeight: 700 }}>KYC Verified ✓</span></p>
        </div>
        <button className="primary-button primary-button--fit" onClick={() => navigate('/vehicles')}>
          + Add Vehicle
        </button>
      </div>

      <PageState loading={loading}>
        {/* 4-stat cards row */}
        <div className="stats-grid">
          <StatCard icon={CarFront} label="Total Vehicles" value={vehicles.length} hint={`${onRentCount} on rent`} tone="mint" />
          <StatCard icon={IndianRupee} label="This Month Revenue" value={`₹${revenueMonth.toLocaleString('en-IN')}`} hint="Current calendar month" tone="dark" badge="+14%" />
          <StatCard icon={ClipboardList} label="Pending Requests" value={pendingBookings.length} hint="Needs action" tone="mint" />
          <StatCard icon={Star} label="Avg. Rating" value="4.8" hint="Avg rating" tone="mint" />
        </div>

        {/* 65/35 vendor dashboard grid */}
        <div className="vendor-dashboard-grid" style={{ marginTop: 18 }}>
          {/* LEFT: Monthly Earnings BarChart */}
          <article className="panel">
            <div className="panel__header">
              <div>
                <h3>Monthly Earnings</h3>
                <small style={{ color: 'var(--text-secondary)' }}>{chartRangeLabel}</small>
              </div>
              <strong>₹{revenueMonth.toLocaleString('en-IN')}</strong>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sixMonthData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {sixMonthData.map((_, i) => (
                      <Cell key={i} fill={i === sixMonthData.length - 1 ? '#111111' : '#D9D9D9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* RIGHT: Fleet Utilization */}
          <article className="panel">
            <div className="panel__header">
              <div><h3>Fleet Utilization</h3></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
              <div className="utilization-bar">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>On Rent</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{onRentCount} · {rentPct}%</span>
                </div>
                <div className="utilization-bar__track">
                  <div className="utilization-bar__fill utilization-bar__fill--rent" style={{ width: `${rentPct}%` }} />
                </div>
              </div>
              <div className="utilization-bar">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Available</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{availableCount} · {availPct}%</span>
                </div>
                <div className="utilization-bar__track">
                  <div className="utilization-bar__fill utilization-bar__fill--avail" style={{ width: `${availPct}%` }} />
                </div>
              </div>
              <div className="utilization-bar">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Maintenance</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{maintenanceCount} · {maintPct}%</span>
                </div>
                <div className="utilization-bar__track">
                  <div className="utilization-bar__fill utilization-bar__fill--maint" style={{ width: `${maintPct}%` }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
              Overall utilization: <strong style={{ color: 'var(--text-primary)' }}>{utilizationPct}%</strong>
            </div>
          </article>
        </div>

        {/* Pending Approval full-width panel */}
        <article className="panel" style={{ marginTop: 18 }}>
          <div className="panel__header">
            <div>
              <h3>Pending Approval <span style={{ background: 'var(--lime)', color: '#111', borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 10px', marginLeft: 8 }}>{pendingBookings.length}</span></h3>
            </div>
          </div>
          <div className="pending-list">
            {pendingBookings.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No pending bookings</p>
            )}
            {pendingBookings.map(b => (
              <div className="pending-item" key={b._id || b.id}>
                <div>
                  <strong>{b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'}</strong>
                  <small>{b.customer?.name || 'Customer'} · {new Date(b.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} – {new Date(b.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-accept"
                    onClick={() => bookingAction.mutate({ id: b._id || b.id, action: 'confirm' })}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => bookingAction.mutate({ id: b._id || b.id, action: 'cancel' })}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* My Fleet full-width panel */}
        <article className="panel" style={{ marginTop: 18 }}>
          <div className="panel__header">
            <div><h3>My Fleet</h3></div>
            <button className="primary-button primary-button--fit" style={{ fontSize: 12 }} onClick={() => navigate('/vehicles')}>
              + Add Vehicle
            </button>
          </div>
          <div className="vehicle-grid">
            {vehicles.slice(0, 4).map(v => (
              <article className="vehicle-card" key={v._id || v.id}>
                <div className="vehicle-card__visual">
                  <CarFront size={44} />
                  <StatusPill value={vehicleStatus(v)} />
                </div>
                <div className="vehicle-card__body">
                  <small>{v.category} · {v.seats} seats · {v.registrationNumber}</small>
                  <h3>{v.brand} {v.model}{v.year ? ` (${v.year})` : ''}</h3>
                  <p>{v.city} · {v.fuelType} · {v.transmission}</p>
                  <div>
                    <strong>₹{v.pricePerDay?.toLocaleString('en-IN')}</strong>
                    <span>/ day</span>
                  </div>
                  <div className="vehicle-card__actions">
                    <button className="edit-button" onClick={() => navigate('/vehicles')}>
                      <Pencil size={13} /> Edit
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </PageState>
    </>
  )
}
