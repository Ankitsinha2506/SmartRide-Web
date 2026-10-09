import { useQuery } from '@tanstack/react-query'
import { CarFront, Clock, IndianRupee, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../services/api'
import { StatCard } from '../../components/ui/StatCard'
import { PageState } from '../../components/ui/PageState'
import { DataTable } from '../../components/ui/DataTable'

export function EarningsPage() {
  const query = useQuery({
    queryKey: ['vendor-bookings'],
    // Note: /bookings/vendor/me returns all bookings without pagination — totals are always complete.
    queryFn: () => api.get('/bookings/vendor/me'),
  })

  const bookings = query.data || []

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
  const activeBookings = bookings.filter(b => b.status === 'ACTIVE')
  const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED')

  const totalEarned = completedBookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const monthEarned = completedBookings
    .filter(b => new Date(b.endDate) >= monthStart)
    .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const activeValue = activeBookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)
  const pendingValue = pendingBookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0)

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

  // Per-vehicle earnings
  const vehicleMap = {}
  completedBookings.forEach(b => {
    const key = b.vehicle?._id || b.vehicle?.id || 'unknown'
    if (!vehicleMap[key]) {
      vehicleMap[key] = {
        vehicleId: key,
        name: b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Unknown vehicle',
        trips: 0,
        revenue: 0,
      }
    }
    vehicleMap[key].trips++
    vehicleMap[key].revenue += b.pricing?.totalAmount || 0
  })
  const vehicleRows = Object.values(vehicleMap).sort((a, b) => b.revenue - a.revenue)

  const vehicleColumns = [
    { key: 'name', label: 'Vehicle', render: r => <div><span className="activity-icon" style={{ display: 'inline-grid', marginRight: 8 }}><CarFront size={14} /></span>{r.name}</div> },
    { key: 'trips', label: 'Trips completed', render: r => r.trips },
    { key: 'revenue', label: 'Total earned', render: r => `₹${r.revenue.toLocaleString('en-IN')}` },
    { key: 'avg', label: 'Avg per trip', render: r => `₹${Math.round(r.revenue / r.trips).toLocaleString('en-IN')}` },
  ]

  // Recent payments: last 10 completed bookings
  const recentPayments = [...completedBookings]
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
    .slice(0, 10)

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Finance</span>
          <h1>Earnings</h1>
          <p>Track your revenue, monitor payment history, and analyse performance by vehicle.</p>
        </div>
      </div>

      <PageState loading={query.isLoading} error={query.error}>
        {/* Summary cards */}
        <div className="earnings-grid">
          <StatCard icon={IndianRupee} label="Total earned" value={`₹${totalEarned.toLocaleString('en-IN')}`} hint="Completed rentals" tone="mint" />
          <StatCard icon={TrendingUp} label="This month" value={`₹${monthEarned.toLocaleString('en-IN')}`} hint="Current calendar month" tone="blue" />
          <StatCard icon={CarFront} label="Active bookings value" value={`₹${activeValue.toLocaleString('en-IN')}`} hint="Currently active" tone="amber" />
          <StatCard icon={Clock} label="Pending bookings value" value={`₹${pendingValue.toLocaleString('en-IN')}`} hint="Confirmed & pending" tone="violet" />
        </div>

        {/* 30-day chart */}
        <article className="panel" style={{ marginTop: 18 }}>
          <div className="panel__header">
            <div><span className="eyebrow">Last 30 days</span><h3>Earnings trend</h3></div>
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

        {/* Bottom tables */}
        <div className="earnings-table-grid">
          {/* Earnings by vehicle */}
          <article className="panel">
            <div className="panel__header">
              <div><span className="eyebrow">Breakdown</span><h3>Earnings by vehicle</h3></div>
            </div>
            {vehicleRows.length === 0
              ? <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No completed bookings yet</p>
              : <DataTable columns={vehicleColumns} rows={vehicleRows} />}
          </article>

          {/* Recent payments */}
          <article className="panel">
            <div className="panel__header">
              <div><span className="eyebrow">History</span><h3>Recent payments</h3></div>
            </div>
            <div className="activity-list">
              {recentPayments.length === 0 && (
                <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No payments yet</p>
              )}
              {recentPayments.map(b => (
                <div key={b._id || b.id}>
                  <span className="activity-icon"><IndianRupee size={16} /></span>
                  <div>
                    <strong>{b.bookingCode}</strong>
                    <small>
                      {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'} ·{' '}
                      {b.customer?.name || 'Customer'}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', color: 'var(--green)' }}>₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}</strong>
                    <small>{new Date(b.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </PageState>
    </>
  )
}
