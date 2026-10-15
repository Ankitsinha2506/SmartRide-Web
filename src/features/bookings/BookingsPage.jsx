import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '../../services/api'
import { DataTable } from '../../components/ui/DataTable'
import { PageState } from '../../components/ui/PageState'
import { StatusPill } from '../../components/ui/StatusPill'
import { FilterBar } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'

const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' }

function rentalDays(booking) {
  if (booking.pricing?.rentalDays) return booking.pricing.rentalDays
  const days = Math.ceil(
    (new Date(booking.endDate) - new Date(booking.startDate)) / 86400000,
  )
  return Math.max(days, 1)
}

function isPendingBooking(booking) {
  return ['PENDING_PAYMENT', 'PENDING_ASSIGNMENT'].includes(booking.status)
}

function isUpcomingBooking(booking) {
  return booking.status === 'CONFIRMED'
}

function vendorStatusLabel(booking) {
  if (booking.status === 'PENDING_PAYMENT' && booking.vendorResponse === 'ACCEPTED') {
    return 'Awaiting payment'
  }
  if (booking.status === 'PENDING_ASSIGNMENT') return 'Assign driver'
  if (booking.status === 'PENDING_PAYMENT') return 'Pending'
  return booking.status
}

function formatAmount(value) {
  return value == null ? '—' : `₹${Number(value).toLocaleString('en-IN')}`
}

export function BookingsPage() {
  const queryClient = useQueryClient()
  const role = useAuthStore(state => state.user?.role)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [searchParams] = useSearchParams()
  const globalSearchTerm = searchParams.get('q') || ''

  const query = useQuery({
    queryKey: role === 'ADMIN' ? ['admin-bookings'] : ['vendor-bookings'],
    queryFn: () => api.get(role === 'ADMIN' ? '/admin/bookings' : '/bookings/vendor/me'),
  })
  const drivers = useQuery({
    queryKey: ['available-drivers'],
    queryFn: () => api.get('/drivers/available'),
    enabled: Boolean(selected && selected.serviceType !== 'CAR_ONLY' && !selected.driver),
  })
  const action = useMutation({
    mutationFn: ({ id, name, data }) =>
      name === 'vendor-response'
        ? api.patch(`/bookings/${id}/vendor-response`, data)
        : api.patch(`/bookings/${id}/${name}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: role === 'ADMIN' ? ['admin-bookings'] : ['vendor-bookings'],
      })
      await queryClient.invalidateQueries({ queryKey: ['vendor-vehicles'] })
      setSelected(null)
    },
  })

  const allBookings = useMemo(() => query.data || [], [query.data])
  const vendorBookings = role === 'VENDOR'
  const visibleBookings = useMemo(() => {
    const searchTerms = [search, globalSearchTerm]
      .map(term => term.trim().toLowerCase())
      .filter(Boolean)
    return allBookings.filter(booking => {
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'PENDING' && isPendingBooking(booking))
        || (statusFilter === 'ACTIVE' && booking.status === 'ACTIVE')
        || (statusFilter === 'UPCOMING' && isUpcomingBooking(booking))
        || (statusFilter === 'COMPLETED' && booking.status === 'COMPLETED')
        || (statusFilter === 'CANCELLED' && booking.status === 'CANCELLED')
      const searchable = [
        booking.bookingCode,
        booking.customer?.name,
        booking.vehicle?.brand,
        booking.vehicle?.model,
        booking.customerVehicle?.make,
        booking.customerVehicle?.model,
        booking.status,
      ].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && searchTerms.every(term => searchable.includes(term))
    })
  }, [allBookings, globalSearchTerm, search, statusFilter])

  const filterOptions = [
    { value: 'ALL', label: 'All', count: allBookings.length },
    { value: 'PENDING', label: 'Pending', count: allBookings.filter(isPendingBooking).length },
    { value: 'ACTIVE', label: 'Active', count: allBookings.filter(b => b.status === 'ACTIVE').length },
    { value: 'UPCOMING', label: 'Upcoming', count: allBookings.filter(isUpcomingBooking).length },
    { value: 'COMPLETED', label: 'Completed', count: allBookings.filter(b => b.status === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: allBookings.filter(b => b.status === 'CANCELLED').length },
  ]

  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)
  const thisMonth = allBookings.filter(booking =>
    booking.createdAt && new Date(booking.createdAt) >= currentMonthStart,
  )
  const acceptedThisMonth = thisMonth.filter(booking =>
    booking.vendorResponse === 'ACCEPTED'
      || ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status),
  ).length
  const declinedThisMonth = thisMonth.filter(booking =>
    booking.vendorResponse === 'DECLINED',
  ).length
  const reviewedThisMonth = acceptedThisMonth + declinedThisMonth
  const acceptanceRate = reviewedThisMonth
    ? Math.round((acceptedThisMonth / reviewedThisMonth) * 100)
    : 0
  const pendingRequests = allBookings.filter(booking =>
    booking.status === 'PENDING_PAYMENT'
      && booking.paymentStatus === 'PENDING'
      && (!booking.vendorResponse || booking.vendorResponse === 'PENDING'),
  ).length

  // Keep the administrator table and its existing workflows unchanged.
  const columns = [
    {
      key: 'code', label: 'Booking',
      render: row => <div><strong>{row.bookingCode}</strong><small>{row.customer?.name}</small></div>,
    },
    { key: 'service', label: 'Service', render: row => <StatusPill value={row.serviceType || 'CAR_ONLY'} /> },
    {
      key: 'vehicle', label: 'Vehicle',
      render: row => row.vehicle
        ? `${row.vehicle.brand || ''} ${row.vehicle.model || ''}`
        : `${row.customerVehicle?.make || ''} ${row.customerVehicle?.model || 'Customer car'}`,
    },
    { key: 'driver', label: 'Driver', render: row => row.driver?.name || 'Not assigned' },
    {
      key: 'dates', label: 'Rental dates',
      render: row => `${new Date(row.startDate).toLocaleDateString()} – ${new Date(row.endDate).toLocaleDateString()}`,
    },
    { key: 'amount', label: 'Amount', render: row => formatAmount(row.pricing?.totalAmount) },
    { key: 'status', label: 'Status', render: row => <StatusPill value={row.status} /> },
    {
      key: 'action', label: 'Action',
      render: row => {
        if (row.serviceType !== 'CAR_ONLY' && !row.driver) {
          return (
            <select
              defaultValue=""
              onClick={event => event.stopPropagation()}
              onChange={event => event.target.value && action.mutate({
                id: row.id || row._id,
                name: 'assign-driver',
                data: { driverId: event.target.value },
              })}
            >
              <option value="">Assign driver</option>
              {(drivers.data || []).map(driver => (
                <option value={driver.id} key={driver.id}>
                  {driver.user?.name} · ₹{driver.ratePerDay}/day
                </option>
              ))}
            </select>
          )
        }
        if (row.status === 'CONFIRMED' && row.serviceType === 'CAR_ONLY') {
          return (
            <button
              className="table-action"
              onClick={event => {
                event.stopPropagation()
                action.mutate({ id: row.id || row._id, name: 'start' })
              }}
            >
              Start rental
            </button>
          )
        }
        if (row.status === 'ACTIVE' && row.serviceType === 'CAR_ONLY') {
          return (
            <button
              className="table-action"
              onClick={event => {
                event.stopPropagation()
                action.mutate({ id: row.id || row._id, name: 'complete' })
              }}
            >
              Complete
            </button>
          )
        }
        return '—'
      },
    },
  ]

  const respond = (booking, decision) => {
    if (
      decision === 'DECLINED'
      && !window.confirm(`Decline booking ${booking.bookingCode}?`)
    ) return

    action.mutate({
      id: booking.id || booking._id,
      name: 'vendor-response',
      data: { decision },
    })
  }

  const runBookingAction = (booking, name, data) => {
    action.mutate({ id: booking.id || booking._id, name, data })
  }

  return (
    <>
      <div className="page-heading vendor-bookings-heading">
        <div>
          <h1>Bookings</h1>
          <p>{allBookings.length} total bookings</p>
        </div>
        {vendorBookings && (
          <label className="vendor-bookings-search">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search bookings"
              onChange={event => setSearch(event.target.value)}
              placeholder="Search bookings..."
              type="search"
              value={search}
            />
          </label>
        )}
      </div>

      {action.error && <div className="form-error">{action.error.message}</div>}

      {vendorBookings && pendingRequests > 0 && (
        <section className="booking-review-banner" aria-live="polite">
          <Clock3 size={21} />
          <div>
            <strong>
              {pendingRequests} booking request{pendingRequests === 1 ? '' : 's'} awaiting your response
            </strong>
            <span>Review requests and respond to keep your customers informed.</span>
          </div>
          <button
            className="booking-review-banner__button"
            onClick={() => setStatusFilter('PENDING')}
            type="button"
          >
            Review now
          </button>
        </section>
      )}

      <div className="vendor-booking-filters">
        <FilterBar options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {vendorBookings ? (
        <PageState loading={query.isLoading} error={query.error}>
          {visibleBookings.length === 0 ? (
            <div className="vendor-bookings-empty">
              <CarFront size={30} />
              <strong>{search || globalSearchTerm ? 'No matching bookings' : 'No bookings in this view'}</strong>
              <span>
                {search || globalSearchTerm
                  ? 'Try another search term.'
                  : 'New customer requests will appear here.'}
              </span>
            </div>
          ) : (
            <div className="vendor-bookings-layout">
              <div className="vendor-booking-list">
                {visibleBookings.map(booking => {
                  const vehicle = booking.vehicle
                  const vehicleName = vehicle
                    ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
                    : `${booking.customerVehicle?.make || ''} ${booking.customerVehicle?.model || 'Vehicle'}`.trim()
                  const start = new Date(booking.startDate)
                  const end = new Date(booking.endDate)
                  const hasDriver = booking.serviceType !== 'CAR_ONLY' || Boolean(booking.driver)
                  const awaitingResponse = booking.status === 'PENDING_PAYMENT'
                    && booking.paymentStatus === 'PENDING'
                    && (!booking.vendorResponse || booking.vendorResponse === 'PENDING')
                  const canStart = booking.status === 'CONFIRMED' && booking.serviceType === 'CAR_ONLY'
                  const canComplete = booking.status === 'ACTIVE' && booking.serviceType === 'CAR_ONLY'

                  return (
                    <article
                      className="vendor-booking-card"
                      key={booking.id || booking._id}
                    >
                      <button
                        aria-label={`View booking ${booking.bookingCode}`}
                        className="vendor-booking-card__details"
                        onClick={() => setSelected(booking)}
                        type="button"
                      >
                        <div className="vendor-booking-card__image">
                          {vehicle?.images?.[0] ? (
                            <img alt={vehicleName} src={vehicle.images[0]} />
                          ) : (
                            <CarFront size={32} />
                          )}
                        </div>
                        <div className="vendor-booking-card__content">
                          <div className="vendor-booking-card__topline">
                            <strong>{booking.customer?.name || 'Customer'}</strong>
                            <span className={`vendor-booking-card__status vendor-booking-card__status--${booking.status.toLowerCase()}`}>
                              {vendorStatusLabel(booking)}
                            </span>
                          </div>
                          <span className="vendor-booking-card__vehicle">
                            {vehicleName} · {booking.bookingCode}
                          </span>
                          <span className="vendor-booking-card__meta">
                            <CalendarDays size={14} />
                            {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' – '}
                            {end.toLocaleDateString('en-IN', dateOptions)}
                            <Clock3 size={14} />
                            {rentalDays(booking)} {rentalDays(booking) === 1 ? 'day' : 'days'}
                            {hasDriver && (
                              <>
                                <UserRound size={14} />
                                With driver
                              </>
                            )}
                          </span>
                          <strong className="vendor-booking-card__amount">
                            {formatAmount(booking.pricing?.totalAmount)}
                          </strong>
                        </div>
                      </button>
                      <div className="vendor-booking-card__actions">
                        {awaitingResponse ? (
                          <>
                            <button
                              className="vendor-booking-action vendor-booking-action--accept"
                              disabled={action.isPending}
                              onClick={() => respond(booking, 'ACCEPTED')}
                              type="button"
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              className="vendor-booking-action vendor-booking-action--decline"
                              disabled={action.isPending}
                              onClick={() => respond(booking, 'DECLINED')}
                              type="button"
                            >
                              <X size={14} /> Decline
                            </button>
                          </>
                        ) : canStart ? (
                          <button
                            className="vendor-booking-action vendor-booking-action--accept"
                            disabled={action.isPending}
                            onClick={() => runBookingAction(booking, 'start')}
                            type="button"
                          >
                            Start rental
                          </button>
                        ) : canComplete ? (
                          <button
                            className="vendor-booking-action vendor-booking-action--accept"
                            disabled={action.isPending}
                            onClick={() => runBookingAction(booking, 'complete')}
                            type="button"
                          >
                            Complete
                          </button>
                        ) : (
                          <StatusPill value={vendorStatusLabel(booking)} />
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <aside className="vendor-bookings-summary">
                <h2>This month</h2>
                <dl>
                  <div><dt>New bookings</dt><dd>{thisMonth.length}</dd></div>
                  <div><dt>Accepted</dt><dd>{acceptedThisMonth}</dd></div>
                  <div><dt>Declined</dt><dd>{declinedThisMonth}</dd></div>
                  <div>
                    <dt>Cancellations</dt>
                    <dd>{thisMonth.filter(booking =>
                      booking.status === 'CANCELLED'
                      && booking.cancellation?.cancelledBy !== 'VENDOR',
                    ).length}</dd>
                  </div>
                  <div><dt>Acceptance rate</dt><dd>{acceptanceRate}%</dd></div>
                </dl>
              </aside>
            </div>
          )}
        </PageState>
      ) : (
        <article className="panel">
          <PageState loading={query.isLoading} error={query.error} empty={!visibleBookings.length}>
            <DataTable columns={columns} rows={visibleBookings} onRowClick={setSelected} />
          </PageState>
        </article>
      )}

      {selected && (
        <Modal
          title="Booking details"
          eyebrow={selected.bookingCode}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="booking-detail">
            <div className="booking-detail__field">
              <label>Status</label>
              <span><StatusPill value={vendorStatusLabel(selected)} /></span>
            </div>
            <div className="booking-detail__field">
              <label>Payment</label>
              <span>{selected.paymentStatus || '—'}</span>
            </div>
            <div className="booking-detail__field">
              <label>Customer</label>
              <span>{selected.customer?.name || '—'}</span>
            </div>
            <div className="booking-detail__field">
              <label>Phone</label>
              <span>{selected.customer?.phone || '—'}</span>
            </div>
            <div className="booking-detail__field">
              <label>Vehicle</label>
              <span>
                {selected.vehicle
                  ? `${selected.vehicle.brand} ${selected.vehicle.model}`
                  : `${selected.customerVehicle?.make || ''} ${selected.customerVehicle?.model || 'Customer car'}`}
              </span>
            </div>
            <div className="booking-detail__field">
              <label>Registration</label>
              <span>{selected.vehicle?.registrationNumber || selected.customerVehicle?.registrationNumber || '—'}</span>
            </div>
            <div className="booking-detail__field">
              <label>Start date</label>
              <span>{new Date(selected.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className="booking-detail__field">
              <label>End date</label>
              <span>{new Date(selected.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className="booking-detail__field">
              <label>Service type</label>
              <span>{selected.serviceType?.replaceAll('_', ' ') || 'CAR ONLY'}</span>
            </div>
            <div className="booking-detail__field">
              <label>Driver</label>
              <span>{selected.driver?.name || 'Not assigned'}</span>
            </div>
            {selected.trip?.pickupAddress && (
              <div className="booking-detail__field">
                <label>Pickup</label>
                <span>{selected.trip.pickupAddress}</span>
              </div>
            )}
            <div className="booking-detail__field">
              <label>Total amount</label>
              <span>{formatAmount(selected.pricing?.totalAmount)}</span>
            </div>
          </div>

          {selected.serviceType !== 'CAR_ONLY' && !selected.driver && (
            <div className="vendor-driver-assignment">
              <label htmlFor="vendor-booking-driver">Assign an available driver</label>
              <select
                id="vendor-booking-driver"
                defaultValue=""
                disabled={drivers.isLoading || action.isPending}
                onChange={event => event.target.value && runBookingAction(
                  selected,
                  'assign-driver',
                  { driverId: event.target.value },
                )}
              >
                <option value="">
                  {drivers.isLoading ? 'Loading drivers…' : 'Choose a driver'}
                </option>
                {(drivers.data || []).map(driver => (
                  <option key={driver.id || driver._id} value={driver.id || driver._id}>
                    {driver.user?.name || driver.name || 'Driver'} · ₹{driver.ratePerDay}/day
                  </option>
                ))}
              </select>
              {drivers.error && <span className="form-error">{drivers.error.message}</span>}
            </div>
          )}

          <div className="modal-actions">
            {selected.status === 'PENDING_PAYMENT'
              && selected.paymentStatus === 'PENDING'
              && (!selected.vendorResponse || selected.vendorResponse === 'PENDING') && (
              <>
                <button
                  className="vendor-booking-action vendor-booking-action--accept"
                  disabled={action.isPending}
                  onClick={() => respond(selected, 'ACCEPTED')}
                  type="button"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  className="vendor-booking-action vendor-booking-action--decline"
                  disabled={action.isPending}
                  onClick={() => respond(selected, 'DECLINED')}
                  type="button"
                >
                  <X size={14} /> Decline
                </button>
              </>
            )}
            {selected.status === 'CONFIRMED' && selected.serviceType === 'CAR_ONLY' && (
              <button
                className="primary-button primary-button--fit"
                disabled={action.isPending}
                onClick={() => runBookingAction(selected, 'start')}
                type="button"
              >
                Start rental
              </button>
            )}
            {selected.status === 'ACTIVE' && selected.serviceType === 'CAR_ONLY' && (
              <button
                className="primary-button primary-button--fit"
                disabled={action.isPending}
                onClick={() => runBookingAction(selected, 'complete')}
                type="button"
              >
                Complete
              </button>
            )}
            <button className="secondary-button" onClick={() => setSelected(null)} type="button">
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
