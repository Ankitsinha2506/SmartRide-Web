import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { VehiclesPage } from './features/vehicles/VehiclesPage'
import { BookingsPage } from './features/bookings/BookingsPage'
import { AdminResourcePage } from './features/admin/AdminResourcePage'
import { ReportsPage } from './features/reports/ReportsPage'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import './App.css'

function ProtectedRoute({ roles }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute roles={['ADMIN', 'VENDOR']} />}><Route element={<DashboardLayout />}>
      <Route index element={<DashboardPage />} /><Route path="notifications" element={<NotificationsPage />} /><Route path="profile" element={<ProfilePage />} />
      <Route element={<ProtectedRoute roles={['VENDOR']} />}><Route path="vehicles" element={<VehiclesPage />} /><Route path="bookings" element={<BookingsPage />} /></Route>
      <Route element={<ProtectedRoute roles={['ADMIN']} />}><Route path="admin/users" element={<AdminResourcePage type="users" />} /><Route path="admin/vendors" element={<AdminResourcePage type="vendors" />} /><Route path="admin/drivers" element={<AdminResourcePage type="drivers" />} /><Route path="admin/bookings" element={<BookingsPage />} /><Route path="admin/vehicles" element={<AdminResourcePage type="vehicles" />} /><Route path="admin/reviews" element={<AdminResourcePage type="reviews" />} /><Route path="reports" element={<ReportsPage />} /><Route path="analytics" element={<AnalyticsPage />} /></Route>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
