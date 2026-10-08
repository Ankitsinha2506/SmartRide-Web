import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/ui/DataTable'
import { PageState } from '../../components/ui/PageState'
import { StatusPill } from '../../components/ui/StatusPill'
import { useAuthStore } from '../../store/authStore'

export function BookingsPage() {
  const qc = useQueryClient()
  const role = useAuthStore(state => state.user?.role)
  const query = useQuery({ queryKey: ['operations-bookings', role], queryFn: () => api.get(role === 'ADMIN' ? '/admin/bookings' : '/bookings/vendor/me') })
  const drivers = useQuery({ queryKey: ['available-drivers'], queryFn: () => api.get('/drivers/available') })
  const action = useMutation({
    mutationFn: ({ id, name, data }) => api.patch(`/bookings/${id}/${name}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations-bookings', role] }),
  })
  const columns = [
    { key: 'code', label: 'Booking', render: r => <div><strong>{r.bookingCode}</strong><small>{r.customer?.name}</small></div> },
    { key: 'service', label: 'Service', render: r => <StatusPill value={r.serviceType || 'CAR_ONLY'}/> },
    { key: 'vehicle', label: 'Vehicle', render: r => r.vehicle ? `${r.vehicle.brand || ''} ${r.vehicle.model || ''}` : `${r.customerVehicle?.make || ''} ${r.customerVehicle?.model || 'Customer car'}` },
    { key: 'driver', label: 'Driver', render: r => r.driver?.name || 'Not assigned' },
    { key: 'dates', label: 'Rental dates', render: r => `${new Date(r.startDate).toLocaleDateString()} – ${new Date(r.endDate).toLocaleDateString()}` },
    { key: 'amount', label: 'Amount', render: r => `₹${r.pricing?.totalAmount?.toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: r => <StatusPill value={r.status}/> },
    { key: 'action', label: 'Action', render: r => {
      if (r.serviceType !== 'CAR_ONLY' && !r.driver) return <select defaultValue="" onChange={event => event.target.value && action.mutate({ id: r.id, name: 'assign-driver', data: { driverId: event.target.value } })}><option value="">Assign driver</option>{(drivers.data || []).map(driver => <option value={driver.id} key={driver.id}>{driver.user?.name} · ₹{driver.ratePerDay}/day</option>)}</select>
      if (r.status === 'CONFIRMED' && r.serviceType === 'CAR_ONLY') return <button className="table-action" onClick={() => action.mutate({ id: r.id, name: 'start' })}>Start rental</button>
      if (r.status === 'ACTIVE' && r.serviceType === 'CAR_ONLY') return <button className="table-action" onClick={() => action.mutate({ id: r.id, name: 'complete' })}>Complete</button>
      return '—'
    } },
  ]
  return <><div className="page-heading"><div><span className="eyebrow">Rental operations</span><h1>Bookings</h1><p>Assign vehicles and verified drivers independently, then track every trip through completion.</p></div></div>{action.error&&<div className="form-error">{action.error.message}</div>}<article className="panel"><PageState loading={query.isLoading} error={query.error} empty={!query.data?.length}><DataTable columns={columns} rows={query.data||[]}/></PageState></article></>
}
