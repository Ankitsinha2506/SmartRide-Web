import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/ui/DataTable'
import { PageState } from '../../components/ui/PageState'
import { StatusPill } from '../../components/ui/StatusPill'
import { FilterBar } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'

export function BookingsPage() {
  const qc = useQueryClient()
  const role = useAuthStore(state => state.user?.role)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const query = useQuery({
    queryKey: ['operations-bookings', role],
    queryFn: () => api.get(role === 'ADMIN' ? '/admin/bookings' : '/bookings/vendor/me'),
  })
  const drivers = useQuery({ queryKey: ['available-drivers'], queryFn: () => api.get('/drivers/available') })
  const action = useMutation({
    mutationFn: ({ id, name, data }) => api.patch(`/bookings/${id}/${name}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations-bookings', role] }),
  })

  const allBookings = query.data || []
  const filtered = statusFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === statusFilter)

  const filterOptions = [
    { value: 'ALL', label: 'All', count: allBookings.length },
    { value: 'PENDING', label: 'Pending', count: allBookings.filter(b => b.status === 'PENDING').length },
    { value: 'CONFIRMED', label: 'Confirmed', count: allBookings.filter(b => b.status === 'CONFIRMED').length },
    { value: 'ACTIVE', label: 'Active', count: allBookings.filter(b => b.status === 'ACTIVE').length },
    { value: 'COMPLETED', label: 'Completed', count: allBookings.filter(b => b.status === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: allBookings.filter(b => b.status === 'CANCELLED').length },
  ]

  const columns = [
    {
      key: 'code', label: 'Booking',
      render: r => <div><strong>{r.bookingCode}</strong><small>{r.customer?.name}</small></div>,
    },
    { key: 'service', label: 'Service', render: r => <StatusPill value={r.serviceType || 'CAR_ONLY'} /> },
    {
      key: 'vehicle', label: 'Vehicle',
      render: r => r.vehicle
        ? `${r.vehicle.brand || ''} ${r.vehicle.model || ''}`
        : `${r.customerVehicle?.make || ''} ${r.customerVehicle?.model || 'Customer car'}`,
    },
    { key: 'driver', label: 'Driver', render: r => r.driver?.name || 'Not assigned' },
    {
      key: 'dates', label: 'Rental dates',
      render: r => `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}`,
    },
    { key: 'amount', label: 'Amount', render: r => `₹${r.pricing?.totalAmount?.toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: r => <StatusPill value={r.status} /> },
    {
      key: 'action', label: 'Action',
      render: r => {
        if (r.serviceType !== 'CAR_ONLY' && !r.driver)
          return (
            <select defaultValue="" onChange={event => event.target.value && action.mutate({ id: r.id, name: 'assign-driver', data: { driverId: event.target.value } })}>
              <option value="">Assign driver</option>
              {(drivers.data || []).map(driver => (
                <option value={driver.id} key={driver.id}>{driver.user?.name} · ₹{driver.ratePerDay}/day</option>
              ))}
            </select>
          )
        if (r.status === 'CONFIRMED' && r.serviceType === 'CAR_ONLY')
          return <button className="table-action" onClick={e => { e.stopPropagation(); action.mutate({ id: r.id, name: 'start' }) }}>Start rental</button>
        if (r.status === 'ACTIVE' && r.serviceType === 'CAR_ONLY')
          return <button className="table-action" onClick={e => { e.stopPropagation(); action.mutate({ id: r.id, name: 'complete' }) }}>Complete</button>
        return '—'
      },
    },
  ]

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Rental operations</span>
          <h1>Bookings</h1>
          <p>Assign vehicles and verified drivers independently, then track every trip through completion.</p>
        </div>
      </div>

      {action.error && <div className="form-error">{action.error.message}</div>}

      <FilterBar options={filterOptions} value={statusFilter} onChange={setStatusFilter} />

      <article className="panel">
        <PageState loading={query.isLoading} error={query.error} empty={!filtered.length}>
          <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />
        </PageState>
      </article>

      {selected && (
        <Modal title="Booking detail" eyebrow="Rental record" onClose={() => setSelected(null)} wide>
          <div className="booking-detail">
            <div className="booking-detail__field">
              <label>Booking code</label>
              <span>{selected.bookingCode}</span>
            </div>
            <div className="booking-detail__field">
              <label>Status</label>
              <span><StatusPill value={selected.status} /></span>
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
              <span>{selected.vehicle?.registrationNumber || '—'}</span>
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
              <span>{selected.serviceType?.replace('_', ' ')}</span>
            </div>
            <div className="booking-detail__field">
              <label>Driver</label>
              <span>{selected.driver?.name || 'Not assigned'}</span>
            </div>
            <div className="booking-detail__field" style={{ gridColumn: '1 / -1' }}>
              <label>Total amount</label>
              <span style={{ fontSize: 22 }}>₹{selected.pricing?.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="modal-actions">
            {selected.status === 'CONFIRMED' && selected.serviceType === 'CAR_ONLY' && (
              <button
                className="primary-button primary-button--fit"
                onClick={() => { action.mutate({ id: selected.id, name: 'start' }); setSelected(null) }}
              >
                Start rental
              </button>
            )}
            {selected.status === 'ACTIVE' && selected.serviceType === 'CAR_ONLY' && (
              <button
                className="primary-button primary-button--fit"
                onClick={() => { action.mutate({ id: selected.id, name: 'complete' }); setSelected(null) }}
              >
                Complete
              </button>
            )}
            <button className="secondary-button" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  )
}
