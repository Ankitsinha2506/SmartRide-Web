import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CarFront,
  Check,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileBadge,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '../../services/api'
import { PageState } from '../../components/ui/PageState'
import { Modal } from '../../components/ui/Modal'

const EMPTY_DOCUMENTS = []
const EMPTY_VEHICLES = []

const documentGroups = [
  {
    label: 'Business documents',
    icon: Building2,
    documents: [
      { type: 'GST_CERTIFICATE', name: 'GST Certificate', icon: Landmark, required: true, lifetime: true },
      { type: 'BUSINESS_PAN', name: 'Business PAN', icon: FileText, required: true, lifetime: true },
      { type: 'TRADE_LICENSE', name: 'Trade Licence', icon: ClipboardList, required: true },
      { type: 'BANK_STATEMENT', name: 'Bank Statement (3 months)', icon: Building2, required: true },
    ],
  },
  {
    label: 'Owner / director documents',
    icon: UserRound,
    documents: [
      { type: 'OWNER_AADHAAR', name: "Owner's Aadhaar", icon: BadgeCheck, required: true, lifetime: true },
      { type: 'OWNER_PAN', name: "Owner's PAN", icon: FileText, required: true, lifetime: true },
      { type: 'ADDRESS_PROOF', name: 'Address Proof', icon: Home, required: false },
    ],
  },
]

const vehicleDocuments = [
  { type: 'RC_BOOK', name: 'RC Book', icon: FileBadge, required: true, lifetime: true },
  { type: 'INSURANCE', name: 'Insurance', icon: ShieldCheck, required: true },
  { type: 'POLLUTION_PUC', name: 'Pollution (PUC)', icon: FileCheck2, required: true },
  { type: 'FITNESS_CERTIFICATE', name: 'Fitness Certificate', icon: ClipboardList, required: true },
]

const statusFilters = [
  { value: 'ALL', label: 'All documents' },
  { value: 'ACTION', label: 'Needs attention' },
  { value: 'UPLOADED', label: 'Uploaded' },
  { value: 'MISSING', label: 'Not uploaded' },
]

const formatDate = date => date
  ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

function documentStatus(document) {
  if (!document) return 'MISSING'
  if (!document.expiryDate) return 'UPLOADED'
  const expiry = new Date(document.expiryDate)
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'EXPIRED'
  if (daysLeft <= 60) return 'EXPIRING'
  return 'UPLOADED'
}

function getVehicleName(vehicle) {
  return vehicle.displayName || [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')
}

function getDocumentLabel(status) {
  if (status === 'MISSING') return 'Not uploaded'
  if (status === 'EXPIRED') return 'Expired'
  if (status === 'EXPIRING') return 'Expiring soon'
  return 'Uploaded'
}

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('BUSINESS')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchParams] = useSearchParams()
  const globalSearchTerm = searchParams.get('q') || ''
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [expiryDate, setExpiryDate] = useState('')
  const [formError, setFormError] = useState('')
  const [kycModalOpen, setKycModalOpen] = useState(false)
  const [panNumber, setPanNumber] = useState('')
  const [kycError, setKycError] = useState('')

  const documentsQuery = useQuery({
    queryKey: ['vendor-documents'],
    queryFn: () => api.get('/vendor-documents'),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vendor-vehicles'],
    queryFn: () => api.get('/vehicles/vendor/me'),
  })
  const profileQuery = useQuery({
    queryKey: ['profile', 'VENDOR'],
    queryFn: () => api.get('/vendors/me'),
  })

  const documents = Array.isArray(documentsQuery.data) ? documentsQuery.data : EMPTY_DOCUMENTS
  const vehicles = Array.isArray(vehiclesQuery.data) ? vehiclesQuery.data : EMPTY_VEHICLES
  const vendor = profileQuery.data
  const kycStatus = vendor?.kyc?.verificationStatus || 'NOT_SUBMITTED'
  const documentUpload = useMutation({
    mutationFn: async ({ definition, vehicleId, file, expiry }) => {
      const formData = new FormData()
      formData.append('file', file)
      const uploaded = await api.post('/uploads/vendor-document', formData)
      return api.post('/vendor-documents', {
        documentType: definition.type,
        name: definition.name,
        vehicleId: vehicleId || null,
        url: uploaded.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        expiryDate: expiry ? new Date(`${expiry}T00:00:00.000Z`).toISOString() : null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vendor-documents'] })
      setSelectedDocument(null)
      setSelectedFile(null)
      setExpiryDate('')
      setFormError('')
    },
    onError: error => setFormError(error?.message || 'The document could not be uploaded. Please try again.'),
  })

  const kycSubmission = useMutation({
    mutationFn: data => api.post('/vendors/me/kyc', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', 'VENDOR'] })
      setKycModalOpen(false)
      setKycError('')
    },
    onError: error => setKycError(error?.message || 'KYC submission failed. Please check your details and try again.'),
  })

  const documentMap = useMemo(() => new Map(
    documents.map(document => [
      `${document.vehicleId?._id || document.vehicleId || 'business'}:${document.documentType}`,
      document,
    ]),
  ), [documents])

  const visibleBusinessGroups = useMemo(() => {
    const terms = [search, globalSearchTerm].map(term => term.trim().toLowerCase()).filter(Boolean)
    return documentGroups.map(group => ({
      ...group,
      documents: group.documents.filter(definition => {
        const document = documentMap.get(`business:${definition.type}`)
        const status = documentStatus(document)
        const searchable = `${definition.name} ${group.label} ${document?.fileName || ''}`.toLowerCase()
        const matchesSearch = terms.every(term => searchable.includes(term))
        const matchesFilter = statusFilter === 'ALL'
          || (statusFilter === 'ACTION' && ['EXPIRED', 'EXPIRING'].includes(status))
          || status === statusFilter
        return matchesSearch && matchesFilter
      }),
    })).filter(group => group.documents.length)
  }, [documentMap, globalSearchTerm, search, statusFilter])

  const visibleVehicles = useMemo(() => {
    const terms = [search, globalSearchTerm].map(term => term.trim().toLowerCase()).filter(Boolean)
    return vehicles.map(vehicle => {
      const vehicleId = vehicle._id || vehicle.id
      const name = getVehicleName(vehicle)
      const rows = vehicleDocuments.filter(definition => {
        const document = documentMap.get(`${vehicleId}:${definition.type}`)
        const status = documentStatus(document)
        const searchable = `${name} ${vehicle.registrationNumber || ''} ${definition.name} ${document?.fileName || ''}`.toLowerCase()
        const matchesSearch = terms.every(term => searchable.includes(term))
        const matchesFilter = statusFilter === 'ALL'
          || (statusFilter === 'ACTION' && ['EXPIRED', 'EXPIRING'].includes(status))
          || status === statusFilter
        return matchesSearch && matchesFilter
      })
      return { ...vehicle, id: vehicleId, name, rows }
    }).filter(vehicle => vehicle.rows.length)
  }, [documentMap, globalSearchTerm, search, statusFilter, vehicles])

  const allDocumentDefinitions = [
    ...documentGroups.flatMap(group => group.documents.map(definition => ({
      ...definition,
      vehicleId: null,
      document: documentMap.get(`business:${definition.type}`),
    }))),
    ...vehicles.flatMap(vehicle => vehicleDocuments.map(definition => ({
      ...definition,
      vehicleId: vehicle._id || vehicle.id,
      document: documentMap.get(`${vehicle._id || vehicle.id}:${definition.type}`),
    }))),
  ]
  const actionItems = allDocumentDefinitions.filter(item => ['EXPIRED', 'EXPIRING'].includes(documentStatus(item.document)))
  const requiredCount = allDocumentDefinitions.filter(item => item.required).length
  const uploadedCount = allDocumentDefinitions.filter(item =>
    item.required && documentStatus(item.document) !== 'MISSING',
  ).length
  const kycPan = documentMap.get(`business:${'BUSINESS_PAN'}`)
  const kycIdentity = documentMap.get(`business:${'OWNER_AADHAAR'}`)
  const isLoading = documentsQuery.isLoading || vehiclesQuery.isLoading || profileQuery.isLoading
  const error = documentsQuery.error || vehiclesQuery.error || profileQuery.error

  const openUpload = (definition, vehicleId = null) => {
    setSelectedDocument({ ...definition, vehicleId })
    setSelectedFile(null)
    setExpiryDate('')
    setFormError('')
  }

  const handleUpload = event => {
    event.preventDefault()
    setFormError('')
    if (!selectedFile || !selectedDocument) {
      setFormError('Choose a document file to continue.')
      return
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setFormError('Upload a PDF, JPG, PNG, or WEBP file.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('The maximum file size is 5 MB.')
      return
    }
    if (!selectedDocument.lifetime && !expiryDate) {
      setFormError('Add the document expiry date to continue.')
      return
    }
    documentUpload.mutate({
      definition: selectedDocument,
      vehicleId: selectedDocument.vehicleId,
      file: selectedFile,
      expiry: selectedDocument.lifetime ? '' : expiryDate,
    })
  }

  const submitKyc = event => {
    event.preventDefault()
    setKycError('')
    if (!kycPan?.url || !kycIdentity?.url) {
      setKycError("Upload both the Business PAN and owner's identity document before submitting KYC.")
      return
    }
    kycSubmission.mutate({
      panNumber: panNumber.trim().toUpperCase(),
      panDocumentUrl: kycPan.url,
      identityDocumentType: 'AADHAAR',
      identityDocumentUrl: kycIdentity.url,
    })
  }

  const openDocument = document => {
    if (!document?.url) return
    window.open(document.url, '_blank', 'noopener,noreferrer')
  }

  const renderDocumentRow = (definition, vehicleId = null) => {
    const document = documentMap.get(`${vehicleId || 'business'}:${definition.type}`)
    const status = documentStatus(document)
    const needsAction = status === 'EXPIRED' || status === 'EXPIRING'
    const Icon = definition.icon
    return (
      <article className="document-row" key={`${vehicleId || 'business'}-${definition.type}`}>
        <span className="document-row__icon"><Icon size={19} /></span>
        <div className="document-row__info">
          <div className="document-row__title">
            <strong>{definition.name}</strong>
            {definition.required && <span className="document-required">Required</span>}
          </div>
          <small>
            {document
              ? `Expiry: ${definition.lifetime ? 'Lifetime' : formatDate(document.expiryDate)}${document.fileName ? ` · ${document.fileName}` : ''}`
              : `Expiry: ${definition.lifetime ? 'Lifetime' : 'Add expiry date when uploading'}`}
          </small>
        </div>
        <span className={`document-status document-status--${status.toLowerCase()}`}>{getDocumentLabel(status)}</span>
        {document
          ? (
            <>
              <button className="document-row__button" type="button" onClick={() => openDocument(document)}>
                <ExternalLink size={14} /> View
              </button>
              <button className={`document-row__button${needsAction ? ' document-row__button--renew' : ''}`} type="button" onClick={() => openUpload(definition, vehicleId)}>
                {needsAction ? 'Renew' : 'Replace'}
              </button>
            </>
          )
          : (
            <button className="document-row__button document-row__button--upload" type="button" onClick={() => openUpload(definition, vehicleId)}>
              <Upload size={14} /> Upload
            </button>
          )}
      </article>
    )
  }

  return (
    <>
      <div className="page-heading document-page-heading">
        <div>
          <span className="eyebrow">Compliance</span>
          <h1>Documents</h1>
          <p>Manage business, owner, and vehicle compliance documents.</p>
        </div>
        <div className="document-page-count">
          <strong>{uploadedCount}<span> / {requiredCount}</span></strong>
          <small>required documents uploaded</small>
        </div>
      </div>

      <PageState loading={isLoading} error={error}>
        <div className={`document-kyc-banner${kycStatus === 'VERIFIED' ? ' document-kyc-banner--verified' : ''}`}>
          <span className="document-kyc-banner__icon">
            {kycStatus === 'VERIFIED' ? <Check size={23} /> : <ShieldCheck size={22} />}
          </span>
          <div className="document-kyc-banner__copy">
            <strong>
              {kycStatus === 'VERIFIED' ? 'KYC verified' : kycStatus === 'PENDING' ? 'KYC under review' : kycStatus === 'REJECTED' ? 'KYC needs attention' : 'Complete your KYC'}
            </strong>
            <span>
              {kycStatus === 'VERIFIED'
                ? 'Your business identity is verified.'
                : kycStatus === 'PENDING'
                  ? 'Your submitted details are awaiting review.'
                  : kycStatus === 'REJECTED'
                    ? vendor?.kyc?.rejectionReason || 'Please review your details and submit again.'
                    : 'Upload your Business PAN and owner identity document to submit verification.'}
            </span>
          </div>
          <span className="document-kyc-banner__status">{kycStatus.replaceAll('_', ' ')}</span>
        </div>

        {actionItems.length > 0 && (
          <section className="document-alert">
            <div className="document-alert__heading">
              <AlertTriangle size={17} />
              <strong>Action required</strong>
              <span>{actionItems.length} document{actionItems.length === 1 ? '' : 's'}</span>
            </div>
            {actionItems.map(item => (
              <div className="document-alert__row" key={`${item.vehicleId || 'business'}-${item.type}`}>
                <span>
                  {item.vehicleId && `${vehicles.find(vehicle => (vehicle._id || vehicle.id) === item.vehicleId) ? getVehicleName(vehicles.find(vehicle => (vehicle._id || vehicle.id) === item.vehicleId)) : 'Vehicle'} — `}
                  {item.name} is <strong>{documentStatus(item.document) === 'EXPIRED' ? 'expired' : 'expiring soon'}</strong>
                  {item.document?.expiryDate && ` (expiry ${formatDate(item.document.expiryDate)})`}
                </span>
                <button type="button" onClick={() => openUpload(item, item.vehicleId)}>Renew</button>
              </div>
            ))}
          </section>
        )}

        <div className="document-toolbar">
          <div className="document-tabs" role="tablist" aria-label="Document category">
            <button type="button" role="tab" aria-selected={activeTab === 'BUSINESS'} className={activeTab === 'BUSINESS' ? 'active' : ''} onClick={() => setActiveTab('BUSINESS')}>
              <Building2 size={15} /> Business & owner
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'VEHICLES'} className={activeTab === 'VEHICLES' ? 'active' : ''} onClick={() => setActiveTab('VEHICLES')}>
              <CarFront size={15} /> Vehicle documents
            </button>
          </div>
          <label className="document-search">
            <Search size={17} />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search documents or vehicles..." aria-label="Search documents or vehicles" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
          </label>
        </div>

        <div className="document-filters" aria-label="Filter documents by status">
          {statusFilters.map(filter => (
            <button type="button" key={filter.value} className={statusFilter === filter.value ? 'active' : ''} onClick={() => setStatusFilter(filter.value)}>
              {filter.label}
              {filter.value === 'ACTION' && actionItems.length > 0 && <span>{actionItems.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'BUSINESS'
          ? (
            <div className="document-section-list">
              {visibleBusinessGroups.map(group => {
                const GroupIcon = group.icon
                return (
                  <section className="document-group" key={group.label}>
                    <div className="document-group__heading">
                      <GroupIcon size={16} />
                      <h2>{group.label}</h2>
                    </div>
                    <div className="document-list">
                      {group.documents.map(definition => renderDocumentRow(definition))}
                    </div>
                  </section>
                )
              })}
              {visibleBusinessGroups.length === 0 && (
                <div className="document-empty"><Search size={23} /><strong>No matching business documents</strong><span>Change your search or document status filter.</span></div>
              )}
              {kycStatus !== 'VERIFIED' && kycPan?.url && kycIdentity?.url && (
                <section className="document-kyc-submit">
                  <div>
                    <strong>Ready to submit KYC?</strong>
                    <span>Business PAN and owner identity files are uploaded. Add your PAN number to send them for review.</span>
                  </div>
                  <button type="button" onClick={() => { setKycError(''); setKycModalOpen(true) }}>Submit for verification</button>
                </section>
              )}
            </div>
          )
          : (
            <div className="document-vehicle-list">
              {visibleVehicles.map(vehicle => (
                <section className="document-vehicle-card" key={vehicle.id}>
                  <div className="document-vehicle-card__heading">
                    <div className="document-vehicle-card__identity">
                      <span><CarFront size={18} /></span>
                      <div>
                        <strong>{vehicle.name}</strong>
                        <small>{vehicle.registrationNumber || 'Registration not provided'}</small>
                      </div>
                    </div>
                    <button className="document-row__button" type="button" onClick={() => openUpload(vehicleDocuments[0], vehicle.id)}>
                      <Upload size={14} /> Add document
                    </button>
                  </div>
                  <div className="document-list">
                    {vehicle.rows.map(definition => renderDocumentRow(definition, vehicle.id))}
                  </div>
                </section>
              ))}
              {visibleVehicles.length === 0 && (
                <div className="document-empty"><CarFront size={23} /><strong>{vehicles.length ? 'No matching vehicle documents' : 'No vehicles in your fleet yet'}</strong><span>{vehicles.length ? 'Change your search or document status filter.' : 'Add a vehicle to manage its RC, insurance, PUC, and fitness documents.'}</span></div>
              )}
            </div>
          )}

        <div className="document-footnote">
          <CheckCircle2 size={15} />
          Uploaded files are stored securely. “Uploaded” means saved to your account; it does not mean an administrator has verified the document.
        </div>
      </PageState>

      {selectedDocument && (
        <Modal
          title={`${documentMap.has(`${selectedDocument.vehicleId || 'business'}:${selectedDocument.type}`) ? 'Renew' : 'Upload'} ${selectedDocument.name}`}
          eyebrow={selectedDocument.vehicleId ? 'Vehicle compliance' : 'Business compliance'}
          onClose={() => { if (!documentUpload.isPending) setSelectedDocument(null) }}
        >
          <form className="document-upload-form" onSubmit={handleUpload}>
            <p className="document-upload-hint">PDF, JPG, PNG, or WEBP · Maximum 5 MB</p>
            <label className="document-file-input">
              <Upload size={19} />
              <strong>{selectedFile?.name || 'Choose a file to upload'}</strong>
              <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Select from your device'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={event => { setSelectedFile(event.target.files?.[0] || null); setFormError('') }} required />
            </label>
            {!selectedDocument.lifetime && (
              <label className="document-expiry-field">
                Expiry date
                <input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} required />
              </label>
            )}
            {formError && <p className="document-form-error" role="alert">{formError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={documentUpload.isPending} onClick={() => setSelectedDocument(null)}>Cancel</button>
              <button type="submit" className="document-upload-submit" disabled={documentUpload.isPending}>
                <Upload size={15} /> {documentUpload.isPending ? 'Uploading…' : 'Upload document'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {kycModalOpen && (
        <Modal title="Submit KYC for verification" eyebrow="Vendor verification" onClose={() => { if (!kycSubmission.isPending) setKycModalOpen(false) }}>
          <form className="document-kyc-form" onSubmit={submitKyc}>
            <p>Your uploaded Business PAN and owner's identity files will be submitted securely for review.</p>
            <label>PAN number
              <input value={panNumber} onChange={event => setPanNumber(event.target.value.toUpperCase().slice(0, 10))} minLength={10} maxLength={10} pattern="[A-Z]{5}[0-9]{4}[A-Z]" placeholder="ABCDE1234F" required />
            </label>
            {kycError && <p className="document-form-error" role="alert">{kycError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={kycSubmission.isPending} onClick={() => setKycModalOpen(false)}>Cancel</button>
              <button type="submit" className="document-upload-submit" disabled={kycSubmission.isPending}>
                <ShieldCheck size={15} /> {kycSubmission.isPending ? 'Submitting…' : 'Submit KYC'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
