import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  BadgePercent,
  Banknote,
  CalendarDays,
  CarFront,
  CheckCircle2,
  IndianRupee,
  Landmark,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { PageState } from '../../components/ui/PageState'
import { Modal } from '../../components/ui/Modal'

const COMMISSION_RATE = 0.03
const PREMIUM_TRIP_TARGET = 50
const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' }
const EMPTY_BOOKINGS = []

function formatCurrency(value) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`
}

function getBookingDate(booking) {
  const date = new Date(booking.endDate)
  return Number.isNaN(date.getTime()) ? null : date
}

function escapeCsv(value) {
  const raw = String(value ?? '')
  const text = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${text.replaceAll('"', '""')}"`
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getVehicleName(booking) {
  const vehicle = booking.vehicle
  if (!vehicle) return 'Vehicle'
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')
}

function getBookingAmount(booking) {
  const amount = Number(booking.pricing?.totalAmount)
  return Number.isFinite(amount) ? amount : 0
}

function buildStatementRows(bookings) {
  return [
    ['Booking', 'Vehicle', 'Completed date', 'Gross revenue (INR)', 'Platform commission (3%)', 'Estimated net earnings (INR)'],
    ...bookings.map(booking => {
      const gross = getBookingAmount(booking)
      return [
        booking.bookingCode || booking._id || booking.id || 'Booking',
        getVehicleName(booking),
        getBookingDate(booking)?.toLocaleDateString('en-IN', dateOptions) || '',
        gross,
        Math.round(gross * COMMISSION_RATE),
        Math.round(gross * (1 - COMMISSION_RATE)),
      ]
    }),
  ]
}

function monthLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'short' })
}

function axisCurrency(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`
  return `₹${value}`
}

const periodOptions = [
  { value: 'year', label: 'Year to date' },
  { value: 'six-months', label: 'Last 6 months' },
  { value: 'twelve-months', label: 'Last 12 months' },
]

function getPeriodStart(period, now) {
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  const months = period === 'six-months' ? 6 : 12
  return new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
}

export function EarningsPage() {
  const [period, setPeriod] = useState('year')
  const [searchParams] = useSearchParams()
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase()
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankDetails, setBankDetails] = useState(null)
  const [bankMessage, setBankMessage] = useState('')
  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  })

  const query = useQuery({
    queryKey: ['vendor-bookings'],
    queryFn: () => api.get('/bookings/vendor/me'),
  })
  const now = new Date()
  const allBookings = Array.isArray(query.data) ? query.data : EMPTY_BOOKINGS
  const completedBookings = useMemo(
    () => allBookings.filter(booking => booking.status === 'COMPLETED' && getBookingDate(booking)),
    [allBookings],
  )
  const periodStart = getPeriodStart(period, now)
  const periodBookings = completedBookings.filter(booking => {
    const isWithinPeriod = getBookingDate(booking) >= periodStart
    const matchesSearch = [
      booking.bookingCode,
      booking.customer?.name,
      booking.vehicle?.brand,
      booking.vehicle?.model,
      booking.vehicle?.registrationNumber,
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm)
    return isWithinPeriod && matchesSearch
  })
  const grossRevenue = periodBookings.reduce((total, booking) => total + getBookingAmount(booking), 0)
  const commission = Math.round(grossRevenue * COMMISSION_RATE)
  const netEarnings = grossRevenue - commission
  const monthCount = period === 'year'
    ? now.getMonth() + 1
    : period === 'six-months' ? 6 : 12
  const averageMonthly = monthCount ? netEarnings / monthCount : 0

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthTrips = completedBookings.filter(booking => getBookingDate(booking) >= currentMonthStart).length
  const premiumProgress = Math.min((currentMonthTrips / PREMIUM_TRIP_TARGET) * 100, 100)

  const chartData = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(periodStart.getFullYear(), periodStart.getMonth() + index, 1)
    const monthlyGross = periodBookings
      .filter(booking => {
        const completedDate = getBookingDate(booking)
        return completedDate.getFullYear() === date.getFullYear()
          && completedDate.getMonth() === date.getMonth()
      })
      .reduce((total, booking) => total + getBookingAmount(booking), 0)

    return {
      month: monthLabel(date),
      gross: monthlyGross,
      net: Math.round(monthlyGross * (1 - COMMISSION_RATE)),
    }
  })

  const vehicleRows = Object.values(periodBookings.reduce((vehicles, booking) => {
    const name = getVehicleName(booking)
    const key = booking.vehicle?._id || booking.vehicle?.id || name
    if (!vehicles[key]) vehicles[key] = { name, trips: 0, gross: 0 }
    vehicles[key].trips += 1
    vehicles[key].gross += getBookingAmount(booking)
    return vehicles
  }, {})).sort((left, right) => right.gross - left.gross)

  const recentBookings = [...periodBookings]
    .sort((left, right) => getBookingDate(right) - getBookingDate(left))
    .slice(0, 12)

  const handleDownloadReport = () => {
    downloadCsv(`smartride-earnings-${period}-${now.toISOString().slice(0, 10)}.csv`, buildStatementRows(periodBookings))
  }

  const handleBankSubmit = event => {
    event.preventDefault()
    setBankDetails(bankForm)
    setBankMessage('Bank details are saved for this page session only. Secure payout setup is not connected yet.')
    setBankModalOpen(false)
  }

  return (
    <>
      <div className="page-heading earnings-heading">
        <div>
          <span className="eyebrow">Finance</span>
          <h1>Earnings</h1>
          <p>Understand your rental revenue, commission, and completed booking activity.</p>
        </div>
        <div className="earnings-heading__actions">
          <label className="earnings-period">
            <CalendarDays size={16} />
            <select value={period} onChange={event => setPeriod(event.target.value)} aria-label="Earnings date range">
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="earnings-action-button" type="button" onClick={handleDownloadReport} disabled={query.isLoading || periodBookings.length === 0}>
            <ArrowDownToLine size={16} /> Export report
          </button>
        </div>
      </div>

      <PageState loading={query.isLoading} error={query.error}>
        <div className="earnings-period-caption">
          {periodStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          {' – '}
          {now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </div>

        <section className="earnings-summary-grid" aria-label="Earnings summary">
          <article className="earnings-summary-card earnings-summary-card--dark">
            <span>Gross revenue</span>
            <strong>{formatCurrency(grossRevenue)}</strong>
            <small>Before platform commission</small>
          </article>
          <article className="earnings-summary-card">
            <span>Net earnings</span>
            <strong>{formatCurrency(netEarnings)}</strong>
            <small>After estimated 3% commission</small>
          </article>
          <article className="earnings-summary-card">
            <span>Average per month</span>
            <strong>{formatCurrency(averageMonthly)}</strong>
            <small>For the selected period</small>
          </article>
          <article className="earnings-summary-card">
            <span>Completed trips</span>
            <strong>{periodBookings.length.toLocaleString('en-IN')}</strong>
            <small>Across your fleet</small>
          </article>
        </section>

        <article className="panel earnings-chart-panel">
          <div className="earnings-section-heading">
            <div>
              <span className="eyebrow">Revenue overview</span>
              <h2>Monthly revenue</h2>
            </div>
            <div className="earnings-chart-legend">
              <span><i className="earnings-legend-dot earnings-legend-dot--gross" /> Gross</span>
              <span><i className="earnings-legend-dot earnings-legend-dot--net" /> Net</span>
            </div>
          </div>
          {periodBookings.length === 0
            ? <div className="earnings-empty"><IndianRupee size={22} /><strong>No completed bookings in this period</strong><span>Try a wider date range or check back after your next completed rental.</span></div>
            : (
              <div className="chart earnings-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4} barCategoryGap="28%">
                    <CartesianGrid stroke="#eeeeee" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={axisCurrency} width={48} />
                    <Tooltip
                      cursor={{ fill: '#f7f7f7' }}
                      formatter={(value, name) => [formatCurrency(Number(value)), name === 'gross' ? 'Gross revenue' : 'Net earnings']}
                      labelStyle={{ color: '#111', fontWeight: 700 }}
                    />
                    <Bar dataKey="gross" name="gross" fill="#b9e51b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="net" name="net" fill="#111111" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </article>

        <div className="earnings-detail-grid">
          <article className="panel">
            <div className="earnings-section-heading">
              <div><span className="eyebrow">Fleet performance</span><h2>By vehicle</h2></div>
              <CarFront size={19} className="earnings-heading-icon" />
            </div>
            {vehicleRows.length === 0
              ? <p className="earnings-no-rows">Vehicle earnings will appear after a rental is completed.</p>
              : (
                <div className="earnings-vehicle-list">
                  {vehicleRows.map(vehicle => {
                    const net = Math.round(vehicle.gross * (1 - COMMISSION_RATE))
                    const share = grossRevenue ? (vehicle.gross / grossRevenue) * 100 : 0
                    return (
                      <div className="earnings-vehicle-row" key={vehicle.name}>
                        <div className="earnings-vehicle-row__top">
                          <strong>{vehicle.name}</strong>
                          <strong>{formatCurrency(net)}</strong>
                        </div>
                        <div className="earnings-progress"><span style={{ width: `${share}%` }} /></div>
                        <div className="earnings-vehicle-row__meta">
                          <span>{vehicle.trips} {vehicle.trips === 1 ? 'trip' : 'trips'} · {share.toFixed(1)}% of gross revenue</span>
                          <span>{formatCurrency(vehicle.gross)} gross</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </article>

          <article className="panel earnings-commission-panel">
            <div className="earnings-section-heading">
              <div><span className="eyebrow">Your breakdown</span><h2>Commission breakdown</h2></div>
              <BadgePercent size={19} className="earnings-heading-icon" />
            </div>
            <div className="earnings-commission-lines">
              <div><span>Gross collected</span><strong>{formatCurrency(grossRevenue)}</strong></div>
              <div><span>Platform commission (3%)</span><strong className="earnings-deduction">−{formatCurrency(commission)}</strong></div>
              <div className="earnings-commission-total"><span>Estimated net earnings</span><strong>{formatCurrency(netEarnings)}</strong></div>
            </div>
            <div className="earnings-tier">
              <div className="earnings-tier__title">
                <strong>{currentMonthTrips >= PREMIUM_TRIP_TARGET ? 'Premium tier progress' : 'Standard tier'}</strong>
                <span>{currentMonthTrips} / {PREMIUM_TRIP_TARGET} trips this month</span>
              </div>
              <p>Complete {PREMIUM_TRIP_TARGET} trips in a month to qualify for the 2.5% premium commission rate.</p>
              <div className="earnings-progress earnings-progress--tier"><span style={{ width: `${premiumProgress}%` }} /></div>
              <small>{Math.max(PREMIUM_TRIP_TARGET - currentMonthTrips, 0)} more {Math.max(PREMIUM_TRIP_TARGET - currentMonthTrips, 0) === 1 ? 'trip' : 'trips'} to reach the monthly target</small>
            </div>
          </article>
        </div>

        <article className="panel earnings-history-panel">
          <div className="earnings-section-heading earnings-history-heading">
            <div><span className="eyebrow">Completed rentals</span><h2>Earnings history</h2></div>
            <button className="earnings-action-button earnings-bank-button" type="button" onClick={() => { setBankMessage(''); setBankModalOpen(true) }}>
              <Landmark size={16} /> {bankDetails ? 'Edit bank details' : 'Add bank details'}
            </button>
          </div>
          {bankMessage && <p className="earnings-session-notice" role="status">{bankMessage}</p>}
          {bankDetails && (
            <div className="earnings-bank-saved">
              <Landmark size={17} />
              <span>
                <strong>{bankDetails.bankName}</strong>
                <small>Account ending in {bankDetails.accountNumber.slice(-4)} · {bankDetails.ifsc}</small>
              </span>
            </div>
          )}
          <p className="earnings-history-note">These rows show completed booking earnings, not confirmed bank transfers. Payout status is not available from the connected service.</p>
          {recentBookings.length === 0
            ? <div className="earnings-empty earnings-empty--history"><Banknote size={22} /><strong>No earnings activity yet</strong><span>Completed bookings will appear here.</span></div>
            : (
              <div className="earnings-history-list">
                {recentBookings.map(booking => {
                  const gross = getBookingAmount(booking)
                  const net = Math.round(gross * (1 - COMMISSION_RATE))
                  const bookingId = booking.bookingCode || booking._id || booking.id || 'booking'
                  const date = getBookingDate(booking)
                  return (
                    <div className="earnings-history-row" key={booking._id || booking.id || bookingId}>
                      <span className="earnings-history-icon"><CheckCircle2 size={19} /></span>
                      <div className="earnings-history-info">
                        <strong>{booking.bookingCode || 'Completed booking'}</strong>
                        <small>{getVehicleName(booking)} · {date?.toLocaleDateString('en-IN', dateOptions)}</small>
                      </div>
                      <span className="earnings-earned-pill"><CheckCircle2 size={13} /> Earned</span>
                      <strong className="earnings-history-amount">{formatCurrency(net)}</strong>
                      <button
                        type="button"
                        className="earnings-receipt-button"
                        onClick={() => downloadCsv(`smartride-statement-${String(bookingId).replace(/[^a-z0-9-]/gi, '-')}.csv`, buildStatementRows([booking]))}
                        aria-label={`Download statement for ${booking.bookingCode || 'booking'}`}
                        title="Download booking statement"
                      >
                        <ArrowDownToLine size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
        </article>
      </PageState>

      {bankModalOpen && (
        <Modal title="Bank details" eyebrow="Payout setup" onClose={() => setBankModalOpen(false)}>
          <p className="earnings-bank-warning">
            <Wallet size={16} />
            <span>Secure bank setup is not connected to the server yet. Details entered here stay in this page only and are cleared when you leave or refresh.</span>
          </p>
          <form onSubmit={handleBankSubmit}>
            <div className="form-grid earnings-bank-form">
              <label>Account holder
                <input autoComplete="name" value={bankForm.accountHolder} onChange={event => setBankForm({ ...bankForm, accountHolder: event.target.value })} required />
              </label>
              <label>Bank name
                <input value={bankForm.bankName} onChange={event => setBankForm({ ...bankForm, bankName: event.target.value })} required />
              </label>
              <label>Account number
                <input inputMode="numeric" autoComplete="off" value={bankForm.accountNumber} onChange={event => setBankForm({ ...bankForm, accountNumber: event.target.value.replace(/\D/g, '').slice(0, 18) })} minLength={9} maxLength={18} required />
              </label>
              <label>IFSC code
                <input autoComplete="off" value={bankForm.ifsc} onChange={event => setBankForm({ ...bankForm, ifsc: event.target.value.toUpperCase().slice(0, 11) })} pattern="[A-Z]{4}0[A-Z0-9]{6}" title="Enter a valid 11-character IFSC code" minLength={11} maxLength={11} required />
              </label>
              <label className="earnings-bank-form__full">UPI ID <span>(optional)</span>
                <input autoComplete="off" value={bankForm.upiId} onChange={event => setBankForm({ ...bankForm, upiId: event.target.value.trim() })} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setBankModalOpen(false)}>Cancel</button>
              <button type="submit" className="earnings-action-button earnings-action-button--primary">Save for this session</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
