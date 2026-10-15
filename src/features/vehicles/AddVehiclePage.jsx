
import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Upload, X } from 'lucide-react'
import { api } from '../../services/api'

const STEPS = [
  'Basic Info',
  'Pricing',
  'Features',
  'Location',
  'Photos',
  'Review',
]

const FEATURES_LIST = [
  'AC',
  'GPS',
  'Bluetooth',
  'USB Charging',
  'Child Seat',
  'Sunroof',
  '4WD',
  'Spare Tyre',
  'First Aid Kit',
  'Dashboard Camera',
]

const CURRENT_YEAR = new Date().getFullYear()
const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const initialForm = {
  category: 'SEDAN',
  brand: '',
  model: '',
  year: String(CURRENT_YEAR),
  displayName: '',
  registrationNumber: '',
  color: '',
  fuelType: 'PETROL',
  transmission: 'MANUAL',
  seats: '5',
  description: '',
  pricePerDay: '',
  weeklyDiscount: '',
  monthlyDiscount: '',
  securityDeposit: '',
  features: [],
  city: '',
  area: '',
  pickupAddress: '',
}

export function AddVehiclePage() {
  const navigate = useNavigate()
  const { vehicleId } = useParams()
  const isEditing = Boolean(vehicleId)
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const vehiclesQuery = useQuery({
    queryKey: ['vendor-vehicles'],
    queryFn: () => api.get('/vehicles/vendor/me'),
    enabled: isEditing,
  })
  const [step, setStep] = useState(0)
  const [formChanges, setFormChanges] = useState({ vehicleId: null, values: {} })
  const [imageChanges, setImageChanges] = useState({ vehicleId: null, images: null })
  const [error, setError] = useState('')
  const currentVehicle = isEditing
    ? vehiclesQuery.data?.find(
      (item) => (item._id || item.id) === vehicleId,
    )
    : null
  const routeVehicleId = vehicleId || null
  const form = {
      ...initialForm,
      ...(currentVehicle
        ? {
            ...currentVehicle,
            year: String(currentVehicle.year || CURRENT_YEAR),
            seats: String(currentVehicle.seats || 5),
            pricePerDay: String(currentVehicle.pricePerDay || ''),
            weeklyDiscount: String(currentVehicle.weeklyDiscount || ''),
            monthlyDiscount: String(currentVehicle.monthlyDiscount || ''),
            securityDeposit: String(currentVehicle.securityDeposit || ''),
            features: currentVehicle.features || [],
          }
        : {}),
      ...(formChanges.vehicleId === routeVehicleId ? formChanges.values : {}),
    }
  const savedImages = (currentVehicle?.images || []).map((url, index) => ({
    id: `existing-${index}-${url}`,
    preview: url,
    url,
  }))
  const images =
    imageChanges.vehicleId === routeVehicleId && imageChanges.images !== null
      ? imageChanges.images
      : savedImages

  const updateImages = (updater) => {
    setImageChanges((previous) => {
      const currentImages =
        previous.vehicleId === routeVehicleId && previous.images !== null
          ? previous.images
          : savedImages
      return {
        vehicleId: routeVehicleId,
        images: updater(currentImages),
      }
    })
  }

  const set = (key, value) => {
    setFormChanges((previous) => ({
      vehicleId: routeVehicleId,
      values: {
        ...(previous.vehicleId === routeVehicleId ? previous.values : {}),
        [key]: value,
      },
    }))
  }

  const toggleFeature = (feature) => {
    set(
      'features',
      form.features.includes(feature)
        ? form.features.filter((item) => item !== feature)
        : [...form.features, feature],
    )
  }

  // Upload and preview vehicle images.
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''

    if (!files.length) return

    setError('')

    const accepted = []
    let message = ''

    for (const file of files) {
      if (images.length + accepted.length >= MAX_IMAGES) {
        message = `You can upload a maximum of ${MAX_IMAGES} images.`
        break
      }

      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ) {
        message = 'Only JPG, PNG and WebP images are allowed.'
        continue
      }

      if (file.size > MAX_IMAGE_SIZE) {
        message = `${file.name} exceeds the 5 MB limit.`
        continue
      }

      const preview = URL.createObjectURL(file)
      accepted.push({
        id: preview,
        file,
        preview,
      })
    }

    if (accepted.length) {
      updateImages((previous) => [...previous, ...accepted])
    }

    if (message) setError(message)
  }

  const removeImage = (id) => {
    updateImages((previous) => {
      const removed = previous.find((image) => image.id === id)

      if (removed?.file) URL.revokeObjectURL(removed.preview)

      return previous.filter((image) => image.id !== id)
    })
  }

  // Validate the current step before continuing.
  const validateStep = () => {
    if (step === 0) {
      if (
        !form.brand.trim() ||
        !form.model.trim() ||
        !form.registrationNumber.trim()
      ) {
        return 'Please fill in Brand, Model and Registration Number.'
      }

      const year = Number(form.year)
      if (
        !Number.isInteger(year) ||
        year < 1990 ||
        year > CURRENT_YEAR + 1
      ) {
        return 'Please enter a valid vehicle year.'
      }

      const seats = Number(form.seats)
      if (!Number.isInteger(seats) || seats < 1 || seats > 20) {
        return 'Seating capacity must be between 1 and 20.'
      }
    }

    if (step === 1) {
      const price = Number(form.pricePerDay)

      if (
        form.pricePerDay === '' ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return 'Price per day must be greater than zero.'
      }

      for (const [label, value] of [
        ['Weekly discount', form.weeklyDiscount],
        ['Monthly discount', form.monthlyDiscount],
      ]) {
        if (
          value !== '' &&
          (!Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 100)
        ) {
          return `${label} must be between 0 and 100%.`
        }
      }

      if (
        form.securityDeposit !== '' &&
        (!Number.isFinite(Number(form.securityDeposit)) ||
          Number(form.securityDeposit) < 0)
      ) {
        return 'Security deposit cannot be negative.'
      }
    }

    if (step === 3 && !form.city.trim()) {
      return 'City is required.'
    }

    if (step === 4 && images.length === 0 && !isEditing) {
      return 'Please upload at least one vehicle photo.'
    }

    return ''
  }

  const next = () => {
    setError('')

    const validationError = validateStep()

    if (validationError) {
      setError(validationError)
      return
    }

    setStep((previous) => Math.min(previous + 1, STEPS.length - 1))
  }

  const back = () => {
    setError('')
    setStep((previous) => Math.max(previous - 1, 0))
  }

  // Upload new photos first, then save their URLs with the vehicle listing.
  const submit = useMutation({
    mutationFn: async () => {
      const uploadedImages = await Promise.all(
        images.filter(({ file }) => file).map(async ({ file }) => {
          const data = new FormData()
          data.append('file', file)
          const uploaded = await api.post('/uploads/vehicle', data)
          return uploaded.url
        }),
      )

      const payload = {
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        displayName: form.displayName.trim() || `${form.brand} ${form.model}`.trim(),
        color: form.color.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        pickupAddress: form.pickupAddress.trim(),
        fuelType: form.fuelType,
        transmission: form.transmission,
        seats: Number(form.seats),
        pricePerDay: Number(form.pricePerDay),
        weeklyDiscount: Number(form.weeklyDiscount || 0),
        monthlyDiscount: Number(form.monthlyDiscount || 0),
        securityDeposit: Number(form.securityDeposit || 0),
        description: form.description.trim(),
        features: form.features,
        images: [
          ...images.filter(({ file }) => !file).map(({ url }) => url),
          ...uploadedImages,
        ],
      }

      if (!isEditing) {
        payload.registrationNumber = form.registrationNumber.trim().toUpperCase()
      }

      return isEditing
        ? api.patch(`/vehicles/${vehicleId}`, payload)
        : api.post('/vehicles', payload)
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['vendor-vehicles'],
      })

      navigate('/vehicles')
    },

    onError: (err) => {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${isEditing ? 'update' : 'create'} vehicle listing.`
      )
    },
  })

  const handleSubmit = () => {
    setError('')

    const validationError = validateStep()

    if (validationError) {
      setError(validationError)
      return
    }

    submit.mutate()
  }

  if (isEditing && vehiclesQuery.isLoading && !vehiclesQuery.data) {
    return <div className="page-state">Loading vehicle details…</div>
  }

  if (isEditing && vehiclesQuery.isError) {
    return (
      <div className="page-state page-state--error" role="alert">
        Could not load this vehicle: {vehiclesQuery.error.message}
      </div>
    )
  }

  if (isEditing && vehiclesQuery.data && !currentVehicle) {
    return (
      <div className="page-state page-state--error" role="alert">
        Vehicle not found in your fleet.
      </div>
    )
  }

  return (
    <div className="content">
      <div className="wizard-page">
        <button
          type="button"
          className="wizard-back"
          onClick={() => navigate('/vehicles')}
        >
          ← Back to Fleet
        </button>

        {/* Step indicator */}
        <div className="wizard-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <div
                className={`wizard-step${
                  i === step ? ' wizard-step--active' : ''
                }${i < step ? ' wizard-step--done' : ''}`}
              >
                <span className="wizard-step__circle">
                  {i < step ? '✓' : i + 1}
                </span>
                {label}
              </div>

              {i < STEPS.length - 1 && (
                <div className="wizard-step-connector" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
            style={{ marginBottom: 16 }}
          >
            {error}
          </div>
        )}

        {/* STEP 1: BASIC INFO */}
        {step === 0 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Vehicle Details</p>

            <div className="wizard-fields-grid">
              <label>
                Vehicle Type *
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {[
                    'BIKE',
                    'SCOOTER',
                    'HATCHBACK',
                    'SEDAN',
                    'SUV',
                    'LUXURY',
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Brand *
                <select
                  required
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                >
                  <option value="">Select brand</option>
                  {[
                    'Maruti Suzuki',
                    'Hyundai',
                    'Honda',
                    'Toyota',
                    'Mahindra',
                    'Tata',
                    'Ford',
                    'Volkswagen',
                    'BMW',
                    'Mercedes',
                    'Audi',
                    'Other',
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Model Name *
                <input
                  required
                  value={form.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="e.g. Innova Crysta"
                />
              </label>

              <label>
                Year *
                <input
                  type="number"
                  min={1990}
                  max={CURRENT_YEAR + 1}
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                />
              </label>

              <label className="full-width">
                Display Name
                <input
                  value={form.displayName}
                  onChange={(e) => set('displayName', e.target.value)}
                  placeholder="e.g. Toyota Innova Crysta"
                />
              </label>

              <label>
                Registration Plate *
                <input
                  required
                  disabled={isEditing}
                  value={form.registrationNumber}
                  onChange={(e) =>
                    set('registrationNumber', e.target.value.toUpperCase())
                  }
                  placeholder="MH-12-AB-1234"
                />
              </label>
              {isEditing && (
                <p className="vehicle-muted full-width">
                  Registration number cannot be changed after a vehicle is listed.
                </p>
              )}

              <label>
                Color
                <input
                  value={form.color}
                  onChange={(e) => set('color', e.target.value)}
                  placeholder="Pearl White"
                />
              </label>

              <label>
                Fuel Type
                <select
                  value={form.fuelType}
                  onChange={(e) => set('fuelType', e.target.value)}
                >
                  {['PETROL', 'DIESEL', 'CNG', 'EV', 'HYBRID'].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Transmission
                <select
                  value={form.transmission}
                  onChange={(e) => set('transmission', e.target.value)}
                >
                  {['MANUAL', 'AUTOMATIC'].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Seating Capacity
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.seats}
                  onChange={(e) => set('seats', e.target.value)}
                />
              </label>

              <label className="full-width">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe your vehicle..."
                />
              </label>
            </div>

            <button
              type="button"
              className="wizard-continue-btn"
              onClick={next}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: PRICING */}
        {step === 1 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Pricing</p>

            <div className="wizard-fields-grid">
              <label>
                Price Per Day (₹) *
                <input
                  type="number"
                  min={1}
                  required
                  value={form.pricePerDay}
                  onChange={(e) => set('pricePerDay', e.target.value)}
                  placeholder="e.g. 1500"
                />
              </label>

              <label>
                Weekly Discount (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.weeklyDiscount}
                  onChange={(e) => set('weeklyDiscount', e.target.value)}
                  placeholder="e.g. 10"
                />
              </label>

              <label>
                Monthly Discount (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.monthlyDiscount}
                  onChange={(e) => set('monthlyDiscount', e.target.value)}
                  placeholder="e.g. 20"
                />
              </label>

              <label>
                Security Deposit (₹)
                <input
                  type="number"
                  min={0}
                  value={form.securityDeposit}
                  onChange={(e) => set('securityDeposit', e.target.value)}
                  placeholder="e.g. 5000"
                />
              </label>
            </div>

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={back}
              >
                Back
              </button>
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={next}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FEATURES */}
        {step === 2 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Features & Amenities</p>

            <div className="wizard-features-grid">
              {FEATURES_LIST.map((feature) => (
                <label key={feature} className="wizard-feature-item">
                  <input
                    type="checkbox"
                    checked={form.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={back}
              >
                Back
              </button>
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={next}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION */}
        {step === 3 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Location</p>

            <div className="wizard-fields-grid">
              <label>
                City *
                <input
                  required
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Pune"
                />
              </label>

              <label>
                Area / Locality
                <input
                  value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                  placeholder="e.g. Hinjewadi"
                />
              </label>

              <label className="full-width">
                Pickup Address
                <textarea
                  rows={3}
                  value={form.pickupAddress}
                  onChange={(e) => set('pickupAddress', e.target.value)}
                  placeholder="Full address for vehicle pickup..."
                />
              </label>
            </div>

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={back}
              >
                Back
              </button>
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={next}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PHOTOS */}
        {step === 4 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Vehicle Photos</p>

            <p className="vehicle-muted">
              Upload JPG, PNG or WebP photos. Maximum 5 MB per image and
              10 images in total.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleImageChange}
            />

            <button
              type="button"
              className="vehicle-upload-area"
              disabled={images.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={36} />
              <strong>
                {images.length >= MAX_IMAGES
                  ? 'Maximum number of photos reached'
                  : 'Choose Vehicle Photos'}
              </strong>
              <span>
                <Upload size={16} />
                {images.length} / {MAX_IMAGES} selected
              </span>
            </button>

            {images.length > 0 && (
              <div className="vehicle-image-grid">
                {images.map((image, index) => (
                  <div className="vehicle-image-card" key={image.id}>
                    <img
                      src={image.preview}
                      alt={`Vehicle photo ${index + 1}`}
                    />

                    <span className="vehicle-image-number">
                      Photo {index + 1}
                    </span>

                    <button
                      type="button"
                      className="vehicle-image-remove"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => removeImage(image.id)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={back}
              >
                Back
              </button>
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={next}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {step === 5 && (
          <div className="wizard-form-card">
            <p className="wizard-section-title">Review Your Listing</p>

            <ReviewSection title="Basic Info">
              <ReviewRow label="Vehicle Type" value={form.category} />
              <ReviewRow label="Brand" value={form.brand} />
              <ReviewRow label="Model" value={form.model} />
              <ReviewRow
                label="Display Name"
                value={form.displayName || `${form.brand} ${form.model}`}
              />
              <ReviewRow label="Year" value={form.year} />
              <ReviewRow
                label="Registration"
                value={form.registrationNumber}
              />
              <ReviewRow label="Color" value={form.color || '—'} />
              <ReviewRow label="Fuel Type" value={form.fuelType} />
              <ReviewRow label="Transmission" value={form.transmission} />
              <ReviewRow label="Seats" value={form.seats} />
              <ReviewRow
                label="Description"
                value={form.description || '—'}
              />
            </ReviewSection>

            <ReviewSection title="Pricing">
              <ReviewRow
                label="Price / Day"
                value={`₹${form.pricePerDay}`}
              />
              <ReviewRow
                label="Weekly Discount"
                value={`${form.weeklyDiscount || '0'}%`}
              />
              <ReviewRow
                label="Monthly Discount"
                value={`${form.monthlyDiscount || '0'}%`}
              />
              <ReviewRow
                label="Security Deposit"
                value={`₹${form.securityDeposit || '0'}`}
              />
            </ReviewSection>

            <ReviewSection title="Location">
              <ReviewRow label="City" value={form.city} />
              <ReviewRow label="Area" value={form.area || '—'} />
              <ReviewRow
                label="Pickup Address"
                value={form.pickupAddress || '—'}
              />
            </ReviewSection>

            <ReviewSection title="Features">
              <ReviewRow
                label="Selected"
                value={form.features.join(', ') || 'None selected'}
              />
            </ReviewSection>

            <ReviewSection title={`Vehicle Photos (${images.length})`}>
              {images.length > 0 ? (
                <div className="vehicle-review-images">
                  {images.map((image, index) => (
                    <img
                      key={image.id}
                      src={image.preview}
                      alt={`Vehicle photo ${index + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <p>No photos selected.</p>
              )}
            </ReviewSection>

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-continue-btn"
                onClick={back}
                disabled={submit.isPending}
              >
                Back
              </button>

              <button
                type="button"
                className="wizard-continue-btn"
                onClick={handleSubmit}
                disabled={submit.isPending}
              >
                {submit.isPending
                  ? isEditing ? 'Saving changes...' : 'Submitting...'
                  : isEditing ? 'Save Changes' : 'Submit Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewSection({ title, children }) {
  return (
    <div className="wizard-review-section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="wizard-review-row">
      <span>{label}</span>
      <span className="vehicle-review-value">{value}</span>
    </div>
  )
}
