import { useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowRight, CarFront, ClipboardCheck, IndianRupee, RefreshCw, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { StatCard } from '../../components/ui/StatCard'
import { PageState } from '../../components/ui/PageState'

export function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const admin = user?.role === 'ADMIN'
  const navigate = useNavigate()

  const vendor = useQueries({
    queries: [
      { queryKey: ['vendor-vehicles'], queryFn: () => api.get('/vehicles/vendor/me'), enabled: !admin },
      { queryKey: ['vendor-bookings'], queryFn: () => api.get('/bookings/vendor/me'), enabled: !admin },
    ]
  })

  if (admin) return <AdminDashboard />

  const loading = vendor.some(q => q.isLoading)
  const vehicles = vendor[0]?.data || []
  const bookings = vendor[1]?.data || []

  // --- Vendor derived metrics ---
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - todayStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
  const revenueTotal = completedBookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const revenueMonth = completedBookings.filter(b => new Date(b.endDate) >= monthStart).reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const revenueWeek = completedBookings.filter(b => new Date(b.endDate) >= weekStart).reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const activeCount = bookings.filter(b => b.status === 'ACTIVE').length
  const availableVehicles = vehicles.filter(v => v.isAvailable).length

  // 30-day chart data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - (29 - i))
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    const amount = completedBookings
      .filter(b => {
        const bd = new Date(b.endDate)
        return bd >= d && bd < new Date(d.getTime() + 86400000)
      })
      .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
    return { date: label, amount }
  })

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5)

  // VENDOR VIEW
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>Good day, {user?.name?.split(' ')[0] || 'partner'}.</h1>
          <p>Here is what is happening across your SmartRide workspace.</p>
        </div>
      </div>
      <PageState loading={loading}>
        {/* Stats row */}
        <div className="stats-grid">
          <StatCard icon={CarFront} label="Total vehicles" value={vehicles.length} hint={`${availableVehicles} available`} tone="mint" />
          <StatCard icon={CarFront} label="Available vehicles" value={availableVehicles} hint="Ready to rent" tone="blue" />
          <StatCard icon={ClipboardCheck} label="Completed bookings" value={completedBookings.length} hint={`${activeCount} active now`} tone="amber" />
          <StatCard icon={IndianRupee} label="Total earned" value={`₹${revenueTotal.toLocaleString('en-IN')}`} hint="Completed rentals" tone="violet" />
        </div>

        {/* Dashboard grid */}
        <div className="dashboard-grid" style={{ marginTop: 18 }}>
          <article className="panel panel--wide">
            <div className="panel__header">
              <div><span className="eyebrow">Last 30 days</span><h3>Revenue trend</h3></div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#146c5b" fill="#d7eee8" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="panel">
            <div className="panel__header">
              <div><span className="eyebrow">Latest activity</span><h3>Recent bookings</h3></div>
            </div>
            <div className="activity-list">
              {recentBookings.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No bookings yet</p>}
              {recentBookings.map(b => (
                <div key={b._id || b.id}>
                  <span className="activity-icon"><CarFront size={17} /></span>
                  <div>
                    <strong>{b.bookingCode}</strong>
                    <small>{b.vehicle?.brand} {b.vehicle?.model}</small>
                  </div>
                  <b style={{ fontSize: 10, color: 'var(--green)' }}>{b.status?.replaceAll('_', ' ')}</b>
                </div>
              ))}
            </div>
            {bookings.length > 0 && (
              <button className="secondary-button" style={{ marginTop: 14, fontSize: 12 }} onClick={() => navigate('/bookings')}>
                View all bookings
              </button>
            )}
          </article>
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => navigate('/vehicles')}>
            <div className="quick-action-btn__icon"><CarFront size={18} /></div>
            <span>Add Vehicle</span>
            <small>Expand your fleet</small>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/bookings')}>
            <div className="quick-action-btn__icon"><ClipboardCheck size={18} /></div>
            <span>View Bookings</span>
            <small>Manage rentals</small>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/earnings')}>
            <div className="quick-action-btn__icon"><TrendingUp size={18} /></div>
            <span>View Earnings</span>
            <small>{`₹${revenueMonth.toLocaleString('en-IN')} this month`}</small>
          </button>
        </div>

        {/* Secondary stats row */}
        <div className="stats-grid" style={{ marginTop: 18, gridTemplateColumns: 'repeat(2,1fr)' }}>
          <StatCard icon={TrendingUp} label="This week" value={`₹${revenueWeek.toLocaleString('en-IN')}`} hint="Completed this week" tone="mint" />
          <StatCard icon={IndianRupee} label="This month" value={`₹${revenueMonth.toLocaleString('en-IN')}`} hint="Completed this month" tone="blue" />
        </div>
      </PageState>
    </>
  )
}

const currency = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const records = value => Array.isArray(value) ? value : value?.items || []
const dateLabel = value => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  : '—'
const percentage = (part, total) => total ? Math.round((part / total) * 100) : 0

function AdminDashboard() {
  const [period, setPeriod] = useState(7)
  const queryClient = useQueryClient()
  const queries = useQueries({
    queries: [
      { queryKey: ['analytics-dashboard'], queryFn: () => api.get('/analytics/dashboard') },
      { queryKey: ['analytics-trends', period], queryFn: () => api.get(`/analytics/trends?days=${period}`) },
      { queryKey: ['admin-bookings'], queryFn: () => api.get('/admin/bookings') },
      { queryKey: ['reports', 'payments'], queryFn: () => api.get('/reports/payments') },
      { queryKey: ['admin', 'vendors'], queryFn: () => api.get('/admin/vendors') },
      { queryKey: ['admin', 'vehicles'], queryFn: () => api.get('/admin/vehicles') },
    ],
  })
  const [summary, trends, bookingQuery, paymentQuery, vendorQuery, vehicleQuery] = queries
  const data = summary.data || {}
  const bookings = records(bookingQuery.data)
  const payments = records(paymentQuery.data)
  const vendors = records(vendorQuery.data)
  const vehicles = records(vehicleQuery.data)
  const activeVendors = vendors.filter(vendor => vendor.approvalStatus === 'APPROVED').length
  const pendingKyc = vendors.filter(vendor => vendor.kyc?.verificationStatus === 'PENDING').length
  const approvedVehicles = vehicles.filter(vehicle => vehicle.isApproved).length
  const successfulPayments = payments.filter(payment => ['CAPTURED', 'PAID', 'SUCCESS', 'SUCCEEDED'].includes(String(payment.status).toUpperCase())).length
  const activeBookings = data.activeBookings ?? bookings.filter(booking => booking.status === 'ACTIVE').length
  const totalBookings = data.bookings ?? bookings.length
  const bookingTrend = (trends.data?.bookings || []).map(item => ({
    ...item,
    label: dateLabel(item._id),
    count: Number(item.count || 0),
  }))
  const revenueTrend = (trends.data?.revenue || []).map(item => ({
    label: dateLabel(item._id),
    revenue: Number(item.revenue || 0),
  }))
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
    .slice(0, 5)
  const bookingTotal = bookingTrend.reduce((total, day) => total + day.count, 0)
  const peakBookingCount = Math.max(0, ...bookingTrend.map(day => day.count))
  const requiredErrors = queries.filter(query => query.error)
  const loading = queries.some(query => query.isLoading)
  const refreshing = queries.some(query => query.isFetching)
  const healthMetrics = [
    { label: 'Vendor verification', value: activeVendors, total: vendors.length, color: 'green' },
    { label: 'Vehicle approval', value: approvedVehicles, total: vehicles.length, color: 'lime' },
    { label: 'Successful payments', value: successfulPayments, total: payments.length, color: 'green' },
  ]

  const exportOverview = () => {
    const rows = [
      ['SmartRide admin overview', new Date().toISOString().slice(0, 10)],
      ['Metric', 'Value'],
      ['Total users', data.users ?? 0],
      ['Active vendors', activeVendors],
      ['Total bookings', totalBookings],
      ['Active bookings', activeBookings],
      ['Platform revenue', data.revenue ?? 0],
      ['Pending vendor KYC', pendingKyc],
      [],
      [`Booking volume (last ${period} days)`, 'Bookings'],
      ...bookingTrend.map(day => [day.label, day.count]),
      [],
      [`Revenue activity (last ${period} days)`, 'Revenue'],
      ...revenueTrend.map(day => [day.label, day.revenue]),
    ]
    const csv = rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `smartride-admin-overview-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const refresh = () => queryClient.invalidateQueries({
    predicate: query => ['analytics-dashboard', 'analytics-trends', 'admin-bookings', 'reports', 'admin'].includes(query.queryKey[0]),
  })

  return (
    <div className="admin-dashboard admin-overview">
      <div className="admin-overview__heading">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Platform overview · Last updated just now</p>
        </div>
        <div className="admin-overview__actions">
          <button className="admin-overview__refresh" onClick={refresh} disabled={refreshing} aria-label="Refresh dashboard" title="Refresh dashboard"><RefreshCw size={16} className={refreshing ? 'spin' : ''} /></button>
          <button className="secondary-button" onClick={exportOverview}><ArrowDownToLine size={16} /> Export report</button>
          <Link className="primary-button primary-button--fit" to="/admin/vendors">Review approvals <ArrowRight size={16} /></Link>
        </div>
      </div>

      <nav className="admin-overview__tabs" aria-label="Admin sections">
        <Link className="is-active" aria-current="page" to="/admin/dashboard">Overview</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/vendors">Vendors</Link>
        <Link to="/admin/bookings">Bookings</Link>
        <Link to="/reports?tab=payments">Payments</Link>
      </nav>

      {requiredErrors.length > 0 && (
        <div className="admin-overview__error" role="alert">
          <strong>Some dashboard data could not be loaded.</strong>
          <span>{requiredErrors.map(query => query.error.message).join(' · ')}</span>
        </div>
      )}

      <PageState loading={loading}>
        <div className="admin-overview__metrics">
          <article className="admin-metric">
            <div className="admin-metric__top"><Users size={23} /><span className="metric-badge metric-badge--green">Marketplace accounts</span></div>
            <strong>{Number(data.users || 0).toLocaleString('en-IN')}</strong><span>Total Users</span>
          </article>
          <article className="admin-metric">
            <div className="admin-metric__top"><ShieldCheck size={23} /><span className="metric-badge metric-badge--amber">{pendingKyc} pending KYC</span></div>
            <strong>{activeVendors.toLocaleString('en-IN')}</strong><span>Active Vendors</span>
          </article>
          <article className="admin-metric">
            <div className="admin-metric__top"><ClipboardCheck size={23} /><span className="metric-badge metric-badge--green">{activeBookings.toLocaleString('en-IN')} active</span></div>
            <strong>{Number(totalBookings).toLocaleString('en-IN')}</strong><span>Live Bookings</span>
          </article>
          <article className="admin-metric">
            <div className="admin-metric__top"><IndianRupee size={23} /><span className="metric-badge metric-badge--green">All-time</span></div>
            <strong>{currency(data.revenue)}</strong><span>Platform Revenue</span>
          </article>
        </div>

        <div className="admin-overview__charts">
          <article className="admin-overview__panel booking-volume">
            <div className="booking-volume__heading">
              <div>
                <h2>Booking Volume</h2>
                <label className="booking-volume__period">
                  <span>{period === 7 ? 'This week · Daily' : `Last ${period} days · Daily`}</span>
                  <select aria-label="Booking chart reporting period" value={period} onChange={event => setPeriod(Number(event.target.value))}>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </label>
              </div>
              <div className="booking-volume__total"><strong>{bookingTotal.toLocaleString('en-IN')}</strong><span>Bookings this week</span></div>
            </div>
            {bookingTrend.length ? (
              <div className="booking-volume__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingTrend} margin={{ top: 22, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#efefed" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a8b91' }} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f5f6f2' }} formatter={value => [value, 'Bookings']} />
                    <Bar dataKey="count" name="Bookings" radius={[9, 9, 0, 0]} maxBarSize={58}>
                      {bookingTrend.map(day => <Cell key={day._id} fill={day.count === peakBookingCount ? '#b4e51f' : '#e5e5e2'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="admin-overview__empty">No booking activity is available for this week.</div>}
          </article>

          <article className="admin-overview__panel platform-health">
            <h2>Platform Health</h2>
            <p className="platform-health__description">Live operational checks from marketplace data</p>
            <div className="platform-health__metrics">
              {healthMetrics.map(metric => (
                <div className="health-metric" key={metric.label}>
                  <div><span>{metric.label}</span><strong>{metric.total ? `${percentage(metric.value, metric.total)}%` : '—'}</strong></div>
                  <div className={`health-metric__track health-metric__track--${metric.color}`} role="progressbar" aria-label={metric.label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage(metric.value, metric.total)}>
                    <span style={{ width: `${percentage(metric.value, metric.total)}%` }} />
                  </div>
                  <small>{metric.value.toLocaleString('en-IN')} of {metric.total.toLocaleString('en-IN')} records</small>
                </div>
              ))}
            </div>
            <Link className="platform-health__link" to="/analytics">View analytics <ArrowRight size={15} /></Link>
          </article>
        </div>

        <article className="admin-overview__panel admin-overview__recent">
          <div className="admin-overview__recent-heading"><div><h2>Recent Bookings</h2><p>Latest activity across the marketplace</p></div><Link to="/admin/bookings">View all <ArrowRight size={15} /></Link></div>
          <div className="table-wrap">
            <table className="admin-overview__table">
              <thead><tr><th>Booking</th><th>Customer / vehicle</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{recentBookings.map((booking, index) => (
                <tr key={booking._id || booking.id || index}>
                  <td><strong>{booking.bookingCode || 'Booking'}</strong></td>
                  <td>{booking.customer?.name || (booking.vehicle ? `${booking.vehicle.brand || ''} ${booking.vehicle.model || ''}`.trim() : 'Marketplace rental')}</td>
                  <td>{dateLabel(booking.createdAt || booking.startDate)}</td>
                  <td>{currency(booking.pricing?.totalAmount)}</td>
                  <td><span className={`status status--${String(booking.status || '').toLowerCase()}`}>{String(booking.status || 'Unknown').replaceAll('_', ' ')}</span></td>
                </tr>
              ))}</tbody>
            </table>
            {!recentBookings.length && <div className="admin-overview__empty">No bookings have been recorded yet.</div>}
          </div>
        </article>
      </PageState>
    </div>
  )
}