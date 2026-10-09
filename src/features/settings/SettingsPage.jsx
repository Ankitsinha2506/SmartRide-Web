import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, Lock, User } from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-switch__track" />
      </label>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  // Password form state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Notification toggles (client-side only)
  // TODO: persist to /vendor/preferences when endpoint is available
  const [notifs, setNotifs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: false,
  })

  const changePw = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      setPwSuccess(true)
      setPwError('')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => {
      setPwError(err?.message || 'Failed to change password.')
      setPwSuccess(false)
    },
  })

  const handlePwSubmit = (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    changePw.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Settings</h1>
          <p>Manage your account security and notification preferences.</p>
        </div>
      </div>

      <div className="settings-stack">
        {/* Account info card */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <User size={18} color="var(--green)" />
            <h3 style={{ margin: 0 }}>Account information</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>Name</p>
              <strong style={{ fontSize: 14 }}>{user?.name || '—'}</strong>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>Email</p>
              <strong style={{ fontSize: 14 }}>{user?.email || '—'}</strong>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>Role</p>
              <strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{user?.role?.toLowerCase() || '—'}</strong>
            </div>
          </div>
          <button
            className="secondary-button primary-button--fit"
            style={{ marginTop: 18 }}
            onClick={() => navigate('/profile')}
          >
            Edit profile
          </button>
        </div>

        {/* Change password card */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Lock size={18} color="var(--green)" />
            <h3 style={{ margin: 0 }}>Security</h3>
          </div>
          <form onSubmit={handlePwSubmit}>
            <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Current password
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  style={{ marginTop: 6, display: 'block', width: '100%' }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                New password
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                  style={{ marginTop: 6, display: 'block', width: '100%' }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Confirm new password
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                  style={{ marginTop: 6, display: 'block', width: '100%' }}
                />
              </label>
            </div>
            {pwError && <div className="form-error" style={{ marginTop: 12 }}>{pwError}</div>}
            {pwSuccess && (
              <div style={{ background: '#ddf1eb', color: '#12614f', padding: '10px 12px', borderRadius: 9, fontSize: 12, marginTop: 12 }}>
                Password changed successfully.
              </div>
            )}
            <button className="primary-button" type="submit" style={{ marginTop: 16, width: 'auto', padding: '11px 20px' }}>
              {changePw.isPending ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </div>

        {/* Notification preferences card */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Bell size={18} color="var(--green)" />
            <h3 style={{ margin: 0 }}>Notification preferences</h3>
          </div>
          {/* TODO: persist to /vendor/preferences when endpoint is available */}
          <ToggleRow
            label="Email notifications"
            checked={notifs.emailNotifications}
            onChange={v => setNotifs({ ...notifs, emailNotifications: v })}
          />
          <ToggleRow
            label="Push notifications"
            checked={notifs.pushNotifications}
            onChange={v => setNotifs({ ...notifs, pushNotifications: v })}
          />
          <ToggleRow
            label="Booking alerts"
            checked={notifs.bookingAlerts}
            onChange={v => setNotifs({ ...notifs, bookingAlerts: v })}
          />
          <ToggleRow
            label="Payment alerts"
            checked={notifs.paymentAlerts}
            onChange={v => setNotifs({ ...notifs, paymentAlerts: v })}
          />
        </div>
      </div>
    </>
  )
}
