import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarFront, Grid2X2, List, Pencil, Plus, Power, Trash2, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageState } from '../../components/ui/PageState'
import { api } from '../../services/api'

const filters = ['All', 'Available', 'On Rent', 'Maintenance', 'Inactive']

function vehicleStatus(vehicle) {
  if (!vehicle.isActive) return 'Inactive'
  if (!vehicle.isApproved) return 'Maintenance'
  return vehicle.isAvailable ? 'Available' : 'On Rent'
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

export function VehiclesPage() {
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('grid')
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [searchParams] = useSearchParams()
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['vendor-vehicles'],
    queryFn: () => api.get('/vehicles/vendor/me'),
  })
  const availability = useMutation({
    mutationFn: ({ id, value }) =>
      api.patch(`/vehicles/${id}/availability`, { isAvailable: value }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['vendor-vehicles'] }),
  })
  const removeVehicle = useMutation({
    mutationFn: (id) => api.delete(`/vehicles/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vendor-vehicles'] })
      setVehicleToDelete(null)
    },
  })

  const vehicles = Array.isArray(query.data) ? query.data : []
  const counts = {
    Total: vehicles.length,
    Available: vehicles.filter((vehicle) => vehicleStatus(vehicle) === 'Available').length,
    'On Rent': vehicles.filter((vehicle) => vehicleStatus(vehicle) === 'On Rent').length,
    Maintenance: vehicles.filter((vehicle) => vehicleStatus(vehicle) === 'Maintenance').length,
  }
  const visibleVehicles = vehicles.filter(vehicle => {
    const matchesFilter = filter === 'All' || vehicleStatus(vehicle) === filter
    const searchable = [
      vehicle.displayName,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.registrationNumber,
      vehicle.city,
      vehicle.category,
      vehicle.fuelType,
      vehicle.transmission,
    ].filter(Boolean).join(' ').toLowerCase()
    return matchesFilter && (!searchTerm || searchable.includes(searchTerm))
  })

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>My Fleet</h1>
          <p>{vehicles.length} vehicles listed</p>
        </div>
        <Link className="primary-button primary-button--fit" to="/vehicles/add">
          <Plus size={18} /> Add Vehicle
        </Link>
      </div>

      <PageState
        loading={query.isLoading}
        error={query.error}
        empty={false}
      >
        <>
          <div className="fleet-page-stats">
            {Object.entries(counts).map(([label, count]) => (
              <div className="fleet-stat-card" key={label}>
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="fleet-filter-row">
            <div className="filter-bar" aria-label="Filter vehicles">
              {filters.map((value) => (
                <button
                  className={`filter-bar__btn${filter === value ? ' filter-bar__btn--active' : ''}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="view-toggle" aria-label="Vehicle view">
              <button
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={view === 'grid' ? 'active' : ''}
                onClick={() => setView('grid')}
                type="button"
              >
                <Grid2X2 size={16} />
              </button>
              <button
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
                type="button"
              >
                <List size={17} />
              </button>
            </div>
          </div>

          {visibleVehicles.length === 0 ? (
            <div className="fleet-empty">
              <CarFront size={32} />
              <strong>
                {vehicles.length === 0
                  ? 'Your fleet is empty'
                  : searchTerm ? 'No matching vehicles' : `No ${filter.toLowerCase()} vehicles`}
              </strong>
              <span>
                {vehicles.length === 0
                  ? 'Add your first vehicle to start building your fleet.'
                  : searchTerm
                    ? 'Try another search term or change the status filter.'
                    : 'Try another filter to view your vehicles.'}
              </span>
              {vehicles.length === 0 && (
                <Link className="primary-button primary-button--fit" to="/vehicles/add">
                  <Plus size={17} /> Add Vehicle
                </Link>
              )}
            </div>
          ) : (
            <div className={view === 'grid' ? 'fleet-grid' : 'fleet-list'}>
              {visibleVehicles.map((vehicle) => {
                const id = vehicle._id || vehicle.id
                const status = vehicleStatus(vehicle)
                const image = vehicle.images?.[0]

                if (view === 'list') {
                  return (
                    <article className="fleet-list-item" key={id}>
                      <div className="fleet-list-item__thumb">
                        <CarFront className="fleet-image-fallback" size={27} aria-hidden="true" />
                        {image ? (
                          <img
                            src={image}
                            alt={vehicle.displayName || `${vehicle.brand} ${vehicle.model}`}
                            onError={event => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="fleet-list-item__info">
                        <h4>{vehicle.displayName || `${vehicle.brand} ${vehicle.model}`}</h4>
                        <small>{vehicle.category} · {vehicle.registrationNumber} · {vehicle.city}</small>
                      </div>
                      <strong className="fleet-card__price">
                        ₹{formatPrice(vehicle.pricePerDay)} <span>/ day</span>
                      </strong>
                      <div className="fleet-list-item__actions">
                        <Link
                          className="fleet-btn-edit"
                          to={`/vehicles/${id}/edit`}
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          aria-label={`Delete ${vehicle.brand} ${vehicle.model}`}
                          className="fleet-btn-delete"
                          onClick={() => setVehicleToDelete(vehicle)}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <button
                        className={`fleet-btn-avail${vehicle.isAvailable ? ' fleet-btn-avail--active' : ''}`}
                        disabled={availability.isPending || status === 'Maintenance' || status === 'Inactive'}
                        onClick={() => availability.mutate({ id, value: !vehicle.isAvailable })}
                        type="button"
                      >
                        <Power size={14} />
                        {vehicle.isAvailable ? 'Available' : 'Paused'}
                      </button>
                    </article>
                  )
                }

                return (
                  <article className="fleet-card" key={id}>
                    <div className="fleet-card__image">
                      <CarFront className="fleet-image-fallback" size={58} aria-hidden="true" />
                      {image ? (
                        <img
                          src={image}
                          alt={vehicle.displayName || `${vehicle.brand} ${vehicle.model}`}
                          onError={event => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <div className="fleet-card__image-overlay">
                        <span className={`fleet-card__status-pill fleet-card__status-pill--${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                        </span>
                        <span className="fleet-card__reg-badge">{vehicle.registrationNumber}</span>
                      </div>
                    </div>
                    <div className="fleet-card__body">
                      <h3>{vehicle.displayName || `${vehicle.brand} ${vehicle.model}`}</h3>
                      <div className="fleet-card__meta">
                        {vehicle.category} · {vehicle.city} · {vehicle.fuelType} · {vehicle.transmission}
                      </div>
                      <div className="fleet-card__price">
                        ₹{formatPrice(vehicle.pricePerDay)} <span>/ day</span>
                      </div>
                      <div className="fleet-card__actions">
                        <Link
                          className="fleet-btn-edit"
                          to={`/vehicles/${id}/edit`}
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          className={`fleet-btn-avail${vehicle.isAvailable ? ' fleet-btn-avail--active' : ''}`}
                          disabled={availability.isPending || status === 'Maintenance' || status === 'Inactive'}
                          onClick={() => availability.mutate({ id, value: !vehicle.isAvailable })}
                          type="button"
                        >
                          <Power size={14} />
                          {vehicle.isAvailable ? 'Available' : 'Paused'}
                        </button>
                        <button
                          aria-label={`Delete ${vehicle.brand} ${vehicle.model}`}
                          className="fleet-btn-delete"
                          onClick={() => setVehicleToDelete(vehicle)}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          {availability.error && (
            <div className="form-error" role="alert">
              {availability.error.message}
            </div>
          )}
          {removeVehicle.error && (
            <div className="form-error" role="alert">
              {removeVehicle.error.message}
            </div>
          )}
        </>
      </PageState>
      {vehicleToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !removeVehicle.isPending && setVehicleToDelete(null)}
          role="presentation"
        >
          <section
            aria-labelledby="delete-vehicle-title"
            aria-modal="true"
            className="modal vehicle-delete-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal__header">
              <div>
                <span className="eyebrow">Remove from fleet</span>
                <h2 id="delete-vehicle-title">Delete this vehicle?</h2>
              </div>
              <button
                aria-label="Close"
                disabled={removeVehicle.isPending}
                onClick={() => setVehicleToDelete(null)}
                type="button"
              >
                <X />
              </button>
            </div>
            <p>
              {vehicleToDelete.brand} {vehicleToDelete.model} will be removed
              from your active fleet.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                disabled={removeVehicle.isPending}
                onClick={() => setVehicleToDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="vehicle-delete-confirm"
                disabled={removeVehicle.isPending}
                onClick={() =>
                  removeVehicle.mutate(
                    vehicleToDelete._id || vehicleToDelete.id,
                  )
                }
                type="button"
              >
                {removeVehicle.isPending ? 'Deleting…' : 'Delete vehicle'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
