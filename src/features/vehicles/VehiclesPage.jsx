import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarFront, Pencil, Plus, Power } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../services/api'
import { PageState } from '../../components/ui/PageState'
import { StatusPill } from '../../components/ui/StatusPill'
import { FilterBar } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'

const initial = {
  category: 'SEDAN', brand: '', model: '', registrationNumber: '', city: '',
  fuelType: 'PETROL', transmission: 'MANUAL', seats: 5, pricePerDay: 1000,
  description: '', year: new Date().getFullYear(), color: '', mileage: 0,
}

export function VehiclesPage() {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(initial)
  const [editTarget, setEditTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const qc = useQueryClient()

  const query = useQuery({ queryKey: ['vendor-vehicles'], queryFn: () => api.get('/vehicles/vendor/me') })

  const create = useMutation({
    mutationFn: () => api.post('/vehicles', {
      ...form,
      seats: Number(form.seats),
      pricePerDay: Number(form.pricePerDay),
      year: form.year ? Number(form.year) : undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-vehicles'] }); setModal(false); setForm(initial) },
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => api.put(`/vehicles/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-vehicles'] }); setEditTarget(null); setForm(initial) },
  })

  const availability = useMutation({
    mutationFn: ({ id, value }) => api.patch(`/vehicles/${id}/availability`, { isAvailable: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-vehicles'] }),
  })

  const filterOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'UNAVAILABLE', label: 'Unavailable' },
  ]

  const allVehicles = query.data || []
  const filtered = allVehicles.filter(v => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'APPROVED') return v.isApproved
    if (statusFilter === 'PENDING') return !v.isApproved
    if (statusFilter === 'AVAILABLE') return v.isAvailable
    if (statusFilter === 'UNAVAILABLE') return !v.isAvailable
    return true
  })

  const openEdit = (v) => {
    setEditTarget(v)
    setForm({
      ...initial,
      category: v.category || initial.category,
      brand: v.brand || '',
      model: v.model || '',
      registrationNumber: v.registrationNumber || '',
      city: v.city || '',
      fuelType: v.fuelType || initial.fuelType,
      transmission: v.transmission || initial.transmission,
      seats: v.seats || initial.seats,
      pricePerDay: v.pricePerDay || initial.pricePerDay,
      description: v.description || '',
      year: v.year || new Date().getFullYear(),
      color: v.color || '',
      mileage: v.mileage || 0,
    })
  }

  const closeModal = () => {
    setModal(false)
    setEditTarget(null)
    setForm(initial)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      seats: Number(form.seats),
      pricePerDay: Number(form.pricePerDay),
      year: form.year ? Number(form.year) : undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
    }
    if (editTarget) {
      update.mutate({ id: editTarget._id || editTarget.id, data: payload })
    } else {
      create.mutate()
    }
  }

  const isOpen = modal || !!editTarget

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Fleet management</span>
          <h1>Your vehicles</h1>
          <p>Manage pricing, readiness, and marketplace approval.</p>
        </div>
        <button className="primary-button primary-button--fit" onClick={() => setModal(true)}>
          <Plus size={18} /> Add vehicle
        </button>
      </div>

      <FilterBar options={filterOptions} value={statusFilter} onChange={setStatusFilter} />

      <PageState loading={query.isLoading} error={query.error} empty={!filtered.length}>
        <div className="vehicle-grid">
          {filtered.map(v => (
            <article className="vehicle-card" key={v._id || v.id}>
              <div className="vehicle-card__visual">
                <CarFront size={44} />
                <StatusPill value={v.isApproved ? 'APPROVED' : 'PENDING'} />
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
                  <button className="edit-button" onClick={() => openEdit(v)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className={`toggle ${v.isAvailable ? 'toggle--on' : ''}`}
                    onClick={() => availability.mutate({ id: v._id || v.id, value: !v.isAvailable })}
                  >
                    <Power size={15} />
                    {v.isAvailable ? 'Available' : 'Paused'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </PageState>

      {isOpen && (
        <Modal
          title={editTarget ? 'Edit vehicle' : 'Add a vehicle'}
          eyebrow={editTarget ? 'Update inventory' : 'New inventory'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {[
                ['brand', 'Brand'],
                ['model', 'Model'],
                ['registrationNumber', 'Registration number'],
                ['city', 'City'],
                ['pricePerDay', 'Price per day'],
                ['seats', 'Seats'],
                ['year', 'Year'],
                ['color', 'Color (optional)'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required={key !== 'color' && key !== 'year'}
                  />
                </label>
              ))}
              {[
                ['category', ['BIKE', 'SCOOTER', 'HATCHBACK', 'SEDAN', 'SUV', 'LUXURY']],
                ['fuelType', ['PETROL', 'DIESEL', 'CNG', 'EV', 'HYBRID']],
                ['transmission', ['MANUAL', 'AUTOMATIC']],
              ].map(([key, values]) => (
                <label key={key} style={{ textTransform: 'capitalize' }}>
                  {key}
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
                    {values.map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
              ))}
              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ marginTop: 6, width: '100%', borderRadius: 9, border: '1px solid var(--line)', padding: '10px 12px', fontFamily: 'inherit', fontSize: 13 }}
                />
              </label>
            </div>
            {(create.error || update.error) && (
              <div className="form-error">{(create.error || update.error)?.message}</div>
            )}
            <button className="primary-button" type="submit">
              {(create.isPending || update.isPending) ? 'Saving…' : editTarget ? 'Save changes' : 'Create vehicle'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
