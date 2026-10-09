import { useQueries, useQuery } from '@tanstack/react-query'
import { CarFront, ClipboardCheck, IndianRupee, Star, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { StatCard } from '../../components/ui/StatCard'
import { PageState } from '../../components/ui/PageState'

export function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const admin = user?.role === 'ADMIN'
  const navigate = useNavigate()

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
