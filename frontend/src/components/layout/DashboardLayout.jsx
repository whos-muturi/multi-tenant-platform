import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  RiCalendarLine, RiLayoutGridLine, RiSettings4Line,
  RiServiceLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
  RiExternalLinkLine, RiClipboardLine,
} from 'react-icons/ri'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard',           icon: RiLayoutGridLine, label: 'Overview'  },
  { path: '/dashboard/bookings',  icon: RiCalendarLine,  label: 'Bookings'  },
  { path: '/dashboard/services',  icon: RiServiceLine,   label: 'Services'  },
  { path: '/dashboard/settings',  icon: RiSettings4Line, label: 'Settings'  },
]

export default function DashboardLayout() {
  const { user, clientData, logout, isAdmin } = useAuth()
  const navigate    = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const bookingUrl = `${window.location.origin}/book/${user?.uid}`

  function copyBookingLink() {
    navigator.clipboard.writeText(bookingUrl)
    toast.success('Booking link copied!')
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white-6">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <RiCalendarLine className="text-surface-950 text-base" />
        </div>
        <span className="font-display font-bold text-white">BookFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="text-lg flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs uppercase tracking-widest text-surface-600 font-medium">Admin</p>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <RiLayoutGridLine className="text-lg flex-shrink-0" />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* Booking link card */}
      <div className="px-3 py-3 border-t border-white-6">
        <div className="bg-surface-900 border border-white-8 rounded-xl p-3 mb-3">
          <p className="text-xs text-surface-500 mb-2">Your booking page</p>
          <p className="text-xs text-surface-300 font-mono truncate mb-2">{bookingUrl}</p>
          <div className="flex gap-2">
            <button
              onClick={copyBookingLink}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 py-1.5 rounded-lg transition-colors"
            >
              <RiClipboardLine />
              Copy
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-accent hover:text-accent-hover bg-accent-8 hover:bg-accent-12 py-1.5 rounded-lg transition-colors"
            >
              <RiExternalLinkLine />
              Open
            </a>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-700 transition-colors group">
          <img
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=1c1c1f&color=e8ff47`}
            alt="avatar"
            className="w-8 h-8 rounded-full border border-white-10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{clientData?.businessName || user?.displayName}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-surface-500 hover:text-danger transition-colors opacity-0 group-hover:opacity-100">
            <RiLogoutBoxLine />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 xl:w-72 bg-surface-900 border-r border-white-6 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface-900 border-r border-white-6 z-10 animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-900 border-b border-white-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <RiCalendarLine className="text-surface-950 text-sm" />
            </div>
            <span className="font-display font-bold text-white">BookFlow</span>
          </div>
          <button
            className="btn-icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <RiCloseLine /> : <RiMenuLine />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-container py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
