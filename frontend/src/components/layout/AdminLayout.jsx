import { Outlet, NavLink } from 'react-router-dom'
import {
  RiLayoutGridLine, RiTeamLine, RiCalendarLine,
  RiArrowLeftLine, RiShieldLine,
} from 'react-icons/ri'
import { Link } from 'react-router-dom'

const adminNav = [
  { path: '/admin',          icon: RiLayoutGridLine, label: 'Overview',  end: true },
  { path: '/admin/clients',  icon: RiTeamLine,       label: 'Clients'        },
  { path: '/admin/bookings', icon: RiCalendarLine,   label: 'All Bookings'   },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-surface-900 border-r border-white-6 flex-shrink-0">
        {/* Admin badge */}
        <div className="px-5 py-5 border-b border-white-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-danger-20 border border-danger-30 flex items-center justify-center">
              <RiShieldLine className="text-danger text-base" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">Admin Panel</p>
              <p className="text-danger text-xs">Platform Owner</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="text-lg" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white-6">
          <Link to="/dashboard" className="nav-link">
            <RiArrowLeftLine className="text-lg" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-surface-900 border-b border-white-6 px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-danger-20 border border-danger-30 flex items-center justify-center">
            <RiShieldLine className="text-danger text-sm" />
          </div>
          <span className="font-display font-bold text-white">Admin Panel</span>
          <Link to="/dashboard" className="ml-auto text-xs text-surface-400 hover:text-white flex items-center gap-1">
            <RiArrowLeftLine /> Dashboard
          </Link>
        </div>

        <main className="page-container py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
