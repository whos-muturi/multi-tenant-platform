import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'

// Pages
import LandingPage     from '@/pages/LandingPage'
import LoginPage       from '@/pages/LoginPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Overview        from '@/pages/dashboard/Overview'
import Bookings        from '@/pages/dashboard/Bookings'
import Services        from '@/pages/dashboard/Services'
import Settings        from '@/pages/dashboard/Settings'
import AdminLayout     from '@/components/layout/AdminLayout'
import AdminOverview   from '@/pages/admin/AdminOverview'
import AdminClients    from '@/pages/admin/AdminClients'
import AdminBookings   from '@/pages/admin/AdminBookings'
import BookingPage     from '@/pages/BookingPage'
import BookingSuccess  from '@/pages/BookingSuccess'
import NotFound        from '@/pages/NotFound'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-surface-400 text-sm font-body">Loading...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/book/:clientId" element={<BookingPage />} />
      <Route path="/booking/success" element={<BookingSuccess />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index              element={<Overview />} />
        <Route path="bookings"    element={<Bookings />} />
        <Route path="services"    element={<Services />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index            element={<AdminOverview />} />
        <Route path="clients"   element={<AdminClients />} />
        <Route path="bookings"  element={<AdminBookings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c1f',
              color:      '#fafafa',
              border:     '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize:   '14px',
            },
            success: { iconTheme: { primary: '#e8ff47', secondary: '#09090b' } },
            error:   { iconTheme: { primary: '#ff4444', secondary: '#09090b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
