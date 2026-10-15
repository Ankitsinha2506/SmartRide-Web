import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  LogOut,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { PageState } from '../../components/ui/PageState'

const tabs = [
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'availability', label: 'Availability', icon: CalendarClock },
  { id: 'account', label: 'Account', icon: LockKeyhole },
]

const defaultNotifications = {
  newBookingRequests: true,
  bookingCancellations: true,
  paymentReceived: true,
  documentExpiryReminders: true,
  platformUpdates: false,
  sms: true,
  whatsapp: true,
  email: true,
}

const defaultBookingPreferences = {
  minimumAdvanceHours: 4,
  maximumAdvanceDays: 60,
  cutoffTime: '22:00',
  unavailableDays: [],
}

const weekdays = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

function makeBusinessForm(profile) {
  const address = profile?.address || {}
  return {
    businessName: profile?.businessName || '',
    businessType: profile?.businessType || 'INDIVIDUAL',
    businessPhone: profile?.businessPhone || profile?.user?.phone || '',
    businessEmail: profile?.businessEmail || profile?.user?.email || '',
    gstNumber: profile?.gstNumber || '',
    postalCode: address.postalCode || '',
    city: address.city || '',
    state: address.state || '',
    addressLine1: address.addressLine1 || '',
    businessDescription: profile?.businessDescription || '',
  }
}

function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={`vendor-setting-toggle${disabled ? ' vendor-setting-toggle--disabled' : ''}`}>
      <div>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={event => onChange(event.target.checked)}
          aria-label={label}
        />
        <span className="toggle-switch__track" />
      </label>
    </div>
  )
}

function SaveBar({ saving, saved, onClick, disabled = false, type = 'button' }) {
  return (
    <div className="vendor-settings-savebar">
      <button type={type} className="vendor-settings-save" onClick={onClick} disabled={saving || disabled}>
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      </button>
      <span>{saved ? 'Your preferences have been saved.' : 'Changes are saved to your vendor account.'}</span>
    </div>
  )
}

function StatusMessage({ error, success }) {
  if (error) return <p className="vendor-settings-message vendor-settings-message--error" role="alert">{error}</p>
  if (success) return <p className="vendor-settings-message vendor-settings-message--success" role="status"><Check size={15} />{success}</p>
  return null
}

export function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, token, setSession, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('business')
  const [businessFormEdits, setBusinessFormEdits] = useState(null)
  const [accountFormEdits, setAccountFormEdits] = useState(null)
  const [notificationEdits, setNotificationEdits] = useState(null)
  const [bookingPreferenceEdits, setBookingPreferenceEdits] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const profileQuery = useQuery({
    queryKey: ['profile', 'VENDOR'],
    queryFn: () => api.get('/vendors/me'),
  })
  const accountQuery = useQuery({
    queryKey: ['account-profile'],
    queryFn: () => api.get('/auth/me'),
  })

  const businessForm = businessFormEdits || makeBusinessForm(profileQuery.data)
  const accountForm = accountFormEdits || {
    name: accountQuery.data?.name || user?.name || '',
    email: accountQuery.data?.email || user?.email || '',
    phone: accountQuery.data?.phone || user?.phone || '',
  }
  const notifications = notificationEdits || {
    ...defaultNotifications,
    ...profileQuery.data?.notificationPreferences,
  }
  const bookingPreferences = bookingPreferenceEdits || {
    ...defaultBookingPreferences,
    ...profileQuery.data?.bookingPreferences,
  }

  const saveVendorPreferences = useMutation({
    mutationFn: data => api.patch('/vendors/me', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', 'VENDOR'] })
    },
  })

  const saveAccount = useMutation({
    mutationFn: data => api.patch('/auth/me', data),
    onSuccess: async updatedUser => {
      setSession({ token, user: updatedUser })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', 'VENDOR'] }),
      ])
    },
  })

  const changePassword = useMutation({
    mutationFn: data => api.put('/auth/change-password', data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordError('')
      setPasswordSuccess('Your password has been updated.')
    },
    onError: error => {
      setPasswordError(error?.message || 'Password could not be changed. Please try again.')
      setPasswordSuccess('')
    },
  })

  const vendor = profileQuery.data
  const account = accountQuery.data || user
  const profileLoading = profileQuery.isLoading || accountQuery.isLoading
  const profileError = profileQuery.error || accountQuery.error
  const savedSection = saveVendorPreferences.isSuccess
    ? saveVendorPreferences.variables?.notificationPreferences ? 'notifications'
      : saveVendorPreferences.variables?.bookingPreferences ? 'availability'
        : 'business'
    : null
  const savingSection = saveVendorPreferences.isPending
    ? saveVendorPreferences.variables?.notificationPreferences ? 'notifications'
      : saveVendorPreferences.variables?.bookingPreferences ? 'availability'
        : 'business'
    : null

  const saveBusiness = event => {
    event.preventDefault()
    saveVendorPreferences.reset()
    const payload = {
      businessName: businessForm.businessName.trim(),
      businessType: businessForm.businessType,
      businessPhone: businessForm.businessPhone.trim(),
      businessEmail: businessForm.businessEmail.trim().toLowerCase(),
      gstNumber: businessForm.gstNumber.trim().toUpperCase(),
      businessDescription: businessForm.businessDescription.trim(),
      address: {
        addressLine1: businessForm.addressLine1.trim(),
        city: businessForm.city.trim(),
        state: businessForm.state.trim(),
        country: 'India',
        postalCode: businessForm.postalCode.trim(),
      },
    }
    if (!payload.gstNumber) delete payload.gstNumber
    saveVendorPreferences.mutate(payload)
  }

  const saveNotifications = () => {
    saveVendorPreferences.reset()
    saveVendorPreferences.mutate({ notificationPreferences: notifications })
  }

  const saveAvailability = () => {
    saveVendorPreferences.reset()
    saveVendorPreferences.mutate({
      bookingPreferences: {
        ...bookingPreferences,
        minimumAdvanceHours: Number(bookingPreferences.minimumAdvanceHours),
        maximumAdvanceDays: Number(bookingPreferences.maximumAdvanceDays),
        unavailableDays: [...new Set(bookingPreferences.unavailableDays)],
      },
    })
  }

  const handleAccountSave = event => {
    event.preventDefault()
    saveAccount.reset()
    saveAccount.mutate({
      name: accountForm.name.trim(),
      email: accountForm.email.trim().toLowerCase(),
      phone: accountForm.phone.trim(),
    })
  }

  const handlePasswordSave = event => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('The new password and confirmation do not match.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.')
      return
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

  const updateBusiness = (key, value) => {
    setBusinessFormEdits(current => ({ ...(current || makeBusinessForm(profileQuery.data)), [key]: value }))
    saveVendorPreferences.reset()
  }

  const updateNotification = (key, value) => {
    setNotificationEdits(current => ({
      ...(current || { ...defaultNotifications, ...profileQuery.data?.notificationPreferences }),
      [key]: value,
    }))
    saveVendorPreferences.reset()
  }

  const updateBookingPreference = (key, value) => {
    setBookingPreferenceEdits(current => ({
      ...(current || { ...defaultBookingPreferences, ...profileQuery.data?.bookingPreferences }),
      [key]: value,
    }))
    saveVendorPreferences.reset()
  }

  const toggleUnavailableDay = day => {
    const current = bookingPreferences.unavailableDays || []
    updateBookingPreference(
      'unavailableDays',
      current.includes(day) ? current.filter(value => value !== day) : [...current, day],
    )
  }

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="vendor-settings-page">
      <div className="page-heading vendor-settings-heading">
        <div>
          <span className="eyebrow">Vendor workspace</span>
          <h1>Settings</h1>
          <p>Manage your business profile, preferences, and account security.</p>
        </div>
        <span className="vendor-settings-account"><UserRound size={16} /> {account?.name || 'Vendor account'}</span>
      </div>

      <div className="vendor-settings-tabs" role="tablist" aria-label="Vendor settings sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <PageState loading={profileLoading} error={profileError}>
        <div className="vendor-settings-content">
          {activeTab === 'business' && (
            <section className="vendor-settings-card">
              <div className="vendor-settings-card__heading">
                <span><Building2 size={18} /></span>
                <div><h2>Business information</h2><p>Keep your business contact and pickup details current.</p></div>
              </div>
              <StatusMessage error={saveVendorPreferences.error?.message} success={savedSection === 'business' ? 'Business profile saved successfully.' : ''} />
              <form onSubmit={saveBusiness}>
                <div className="vendor-settings-form-grid">
                  <label>Business name
                    <input value={businessForm.businessName} onChange={event => updateBusiness('businessName', event.target.value)} minLength={2} maxLength={120} required />
                  </label>
                  <label>Business type
                    <select value={businessForm.businessType} onChange={event => updateBusiness('businessType', event.target.value)}>
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="PROPRIETORSHIP">Proprietorship</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="COMPANY">Company</option>
                    </select>
                  </label>
                  <label>Business phone
                    <input type="tel" value={businessForm.businessPhone} onChange={event => updateBusiness('businessPhone', event.target.value)} minLength={10} maxLength={15} required />
                  </label>
                  <label>Business email
                    <input type="email" value={businessForm.businessEmail} onChange={event => updateBusiness('businessEmail', event.target.value)} required />
                  </label>
                  <label>GST number <span>(optional)</span>
                    <input value={businessForm.gstNumber} onChange={event => updateBusiness('gstNumber', event.target.value.toUpperCase().slice(0, 15))} minLength={15} maxLength={15} pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]" />
                  </label>
                  <label>PIN code
                    <input value={businessForm.postalCode} onChange={event => updateBusiness('postalCode', event.target.value.replace(/\D/g, '').slice(0, 10))} minLength={4} maxLength={10} required />
                  </label>
                  <label>City
                    <input value={businessForm.city} onChange={event => updateBusiness('city', event.target.value)} minLength={2} required />
                  </label>
                  <label>State
                    <input value={businessForm.state} onChange={event => updateBusiness('state', event.target.value)} minLength={2} required />
                  </label>
                  <label className="vendor-settings-form-grid__full">Pickup address
                    <input value={businessForm.addressLine1} onChange={event => updateBusiness('addressLine1', event.target.value)} minLength={3} required />
                  </label>
                  <label className="vendor-settings-form-grid__full">Business description <span>(optional)</span>
                    <textarea value={businessForm.businessDescription} onChange={event => updateBusiness('businessDescription', event.target.value)} maxLength={1000} rows={4} />
                    <small className="vendor-settings-character-count">{businessForm.businessDescription.length}/1000</small>
                  </label>
                </div>
                <SaveBar type="submit" saving={savingSection === 'business'} saved={savedSection === 'business'} />
              </form>
              {vendor?.approvalStatus && (
                <div className="vendor-settings-note"><ShieldCheck size={15} /> Vendor approval status: <strong>{vendor.approvalStatus.toLowerCase()}</strong></div>
              )}
            </section>
          )}

          {activeTab === 'bank' && (
            <section className="vendor-settings-card">
              <div className="vendor-settings-card__heading">
                <span><CreditCard size={18} /></span>
                <div><h2>Payout bank account</h2><p>Manage where your rental earnings are paid.</p></div>
              </div>
              <div className="vendor-settings-notice vendor-settings-notice--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong>Secure payout setup is not connected yet</strong>
                  <p>This app does not currently have a verified bank-account API. For your security, bank account numbers are not stored in browser storage or saved as unencrypted profile data.</p>
                </div>
              </div>
              <div className="vendor-settings-bank-placeholder">
                <CreditCard size={22} />
                <strong>No verified payout account connected</strong>
                <span>When secure payout setup is available, your verified account and payout status will appear here.</span>
                <Link to="/earnings">View earnings</Link>
              </div>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="vendor-settings-card">
              <div className="vendor-settings-card__heading">
                <span><Bell size={18} /></span>
                <div><h2>Notification preferences</h2><p>Choose which vendor alerts and delivery channels you prefer.</p></div>
              </div>
              <StatusMessage error={saveVendorPreferences.error?.message} success={savedSection === 'notifications' ? 'Notification preferences saved.' : ''} />
              <div className="vendor-settings-subheading">Booking and account alerts</div>
              <ToggleRow label="New booking requests" description="Be notified when a customer requests a vehicle." checked={notifications.newBookingRequests} onChange={value => updateNotification('newBookingRequests', value)} />
              <ToggleRow label="Booking cancellations" description="Know when a customer cancels a booking." checked={notifications.bookingCancellations} onChange={value => updateNotification('bookingCancellations', value)} />
              <ToggleRow label="Payment received" description="Receive an alert when a payment update is recorded." checked={notifications.paymentReceived} onChange={value => updateNotification('paymentReceived', value)} />
              <ToggleRow label="Document expiry reminders" description="Get reminders about upcoming document expiry dates." checked={notifications.documentExpiryReminders} onChange={value => updateNotification('documentExpiryReminders', value)} />
              <ToggleRow label="Platform updates" description="Occasional product news and feature announcements." checked={notifications.platformUpdates} onChange={value => updateNotification('platformUpdates', value)} />
              <div className="vendor-settings-subheading vendor-settings-subheading--border">Preferred channels</div>
              <ToggleRow label="SMS" description="Text messages to your account phone number." checked={notifications.sms} onChange={value => updateNotification('sms', value)} />
              <ToggleRow label="WhatsApp" description="WhatsApp messages to your account phone number." checked={notifications.whatsapp} onChange={value => updateNotification('whatsapp', value)} />
              <ToggleRow label="Email" description="Email messages to your account email address." checked={notifications.email} onChange={value => updateNotification('email', value)} />
              <div className="vendor-settings-notice"><Bell size={17} /><p>These preferences are saved to your account. Delivery channels are preference settings; message delivery depends on platform notification integrations.</p></div>
              <SaveBar saving={savingSection === 'notifications'} saved={savedSection === 'notifications'} onClick={saveNotifications} />
            </section>
          )}

          {activeTab === 'availability' && (
            <section className="vendor-settings-card">
              <div className="vendor-settings-card__heading">
                <span><CalendarClock size={18} /></span>
                <div><h2>Booking preferences</h2><p>Set your preferred notice period and weekly unavailable days.</p></div>
              </div>
              <StatusMessage error={saveVendorPreferences.error?.message} success={savedSection === 'availability' ? 'Booking preferences saved.' : ''} />
              <div className="vendor-settings-notice vendor-settings-notice--warning">
                <AlertTriangle size={18} />
                <p>These preferences are saved to your vendor profile. The current booking service does not automatically enforce them or change your vehicles’ availability.</p>
              </div>
              <div className="vendor-settings-subheading">Booking rules</div>
              <div className="vendor-settings-fields-three">
                <label>Minimum advance notice (hours)
                  <input type="number" min="0" max="720" value={bookingPreferences.minimumAdvanceHours} onChange={event => updateBookingPreference('minimumAdvanceHours', event.target.value)} />
                </label>
                <label>Maximum booking advance (days)
                  <input type="number" min="1" max="365" value={bookingPreferences.maximumAdvanceDays} onChange={event => updateBookingPreference('maximumAdvanceDays', event.target.value)} />
                </label>
                <label>Preferred cutoff time
                  <input type="time" value={bookingPreferences.cutoffTime} onChange={event => updateBookingPreference('cutoffTime', event.target.value)} />
                </label>
              </div>
              <div className="vendor-settings-subheading vendor-settings-subheading--spaced">Regular days off</div>
              <div className="vendor-settings-weekdays">
                {weekdays.map(day => {
                  const selected = bookingPreferences.unavailableDays?.includes(day.value)
                  return (
                    <button type="button" key={day.value} className={selected ? 'active' : ''} aria-pressed={Boolean(selected)} onClick={() => toggleUnavailableDay(day.value)}>
                      {selected && <Check size={13} />}{day.label}
                    </button>
                  )
                })}
              </div>
              <div className="vendor-settings-note"><Clock3 size={15} /> Update each vehicle’s live availability from <Link to="/vehicles">My Fleet</Link>.</div>
              <SaveBar saving={savingSection === 'availability'} saved={savedSection === 'availability'} onClick={saveAvailability} />
            </section>
          )}

          {activeTab === 'account' && (
            <>
              <section className="vendor-settings-card">
                <div className="vendor-settings-card__heading">
                  <span><UserRound size={18} /></span>
                  <div><h2>Account information</h2><p>Update the name and contact details used to sign in.</p></div>
                </div>
                <StatusMessage error={saveAccount.error?.message} success={saveAccount.isSuccess ? 'Account information updated.' : ''} />
                <form onSubmit={handleAccountSave}>
                  <div className="vendor-settings-form-grid">
                    <label>Full name
                      <input value={accountForm.name} onChange={event => setAccountFormEdits({ ...accountForm, name: event.target.value })} minLength={2} maxLength={80} required />
                    </label>
                    <label>Email address
                      <input type="email" value={accountForm.email} onChange={event => setAccountFormEdits({ ...accountForm, email: event.target.value })} required />
                    </label>
                    <label>Phone number
                      <input type="tel" value={accountForm.phone} onChange={event => setAccountFormEdits({ ...accountForm, phone: event.target.value })} minLength={10} maxLength={15} required />
                    </label>
                    <div className="vendor-settings-readonly"><span>Account role</span><strong>{account?.role?.toLowerCase() || 'vendor'}</strong></div>
                  </div>
                  <button className="vendor-settings-save" type="submit" disabled={saveAccount.isPending}>
                    <Save size={16} /> {saveAccount.isPending ? 'Saving…' : 'Save account details'}
                  </button>
                </form>
              </section>

              <section className="vendor-settings-card">
                <div className="vendor-settings-card__heading">
                  <span><LockKeyhole size={18} /></span>
                  <div><h2>Password and security</h2><p>Change your password using your current credentials.</p></div>
                </div>
                <form onSubmit={handlePasswordSave}>
                  <div className="vendor-settings-form-grid">
                    <label className="vendor-settings-form-grid__full">Current password
                      <input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={event => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required />
                    </label>
                    <label>New password
                      <input type="password" autoComplete="new-password" minLength={8} value={passwordForm.newPassword} onChange={event => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required />
                    </label>
                    <label>Confirm new password
                      <input type="password" autoComplete="new-password" minLength={8} value={passwordForm.confirmPassword} onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required />
                    </label>
                  </div>
                  <StatusMessage error={passwordError || changePassword.error?.message} success={passwordSuccess} />
                  <button className="vendor-settings-save" type="submit" disabled={changePassword.isPending}>
                    <LockKeyhole size={16} /> {changePassword.isPending ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </section>

              <section className="vendor-settings-card vendor-settings-card--signout">
                <div><h2>Sign out</h2><p>Sign out of this vendor account on this device.</p></div>
                <button type="button" className="vendor-settings-signout" onClick={signOut}><LogOut size={16} /> Sign out</button>
              </section>
            </>
          )}
        </div>
      </PageState>
    </div>
  )
}
