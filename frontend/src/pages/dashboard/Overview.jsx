import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RiCalendarLine, RiMoneyDollarCircleLine, RiServiceLine,
  RiArrowRightLine, RiArrowUpLine, RiArrowDownLine,
  RiTimeLine, RiCheckLine,
} from 'react-icons/ri'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { getClientStats, subscribeToBookings } from '@/lib/firestore'
import { format, parseISO } from 'date-fns'

const STATUS_COLORS = {
  confirmed: 'badge-success',
  pending:   'badge-warning',
  cancelled: 'badge-danger',
}

export default function Overview() {
  const { user, clientData } = useAuth()
  const [stats,    setStats]    = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    getClientStats(user.uid).then(s => {
      setStats(s)
      setLoading(false)
    })
    const unsub = subscribeToBookings(user.uid, (b) => setBookings(b))
    return unsub
  }, [user])

  // Build chart data from last 7 days
  const chartData = buildChartData(bookings)

  if (loading) return <OverviewSkeleton />

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">
          Good {greeting()},{' '}
          <span className="text-gradient-accent">
            {clientData?.businessName?.split(' ')[0] || 'there'}
          </span>
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Here's what's happening with your bookings today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings ?? 0}
          sub={`${stats?.monthBookings ?? 0} this month`}
          icon={RiCalendarLine}
          iconColor="text-accent"
          iconBg="bg-accent/10"
          trend="up"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          sub={`${formatCurrency(stats?.monthRevenue ?? 0)} this month`}
          icon={RiMoneyDollarCircleLine}
          iconColor="text-cyan-accent"
          iconBg="bg-cyan-accent/10"
          trend="up"
        />
        <StatCard
          label="Services"
          value={clientData?.services?.length ?? 0}
          sub="active services"
          icon={RiServiceLine}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatCard
          label="Avg. Booking Value"
          value={formatCurrency(
            stats?.totalBookings
              ? Math.round(stats.totalRevenue / stats.totalBookings)
              : 0
          )}
          sub="per booking"
          icon={RiMoneyDollarCircleLine}
          iconColor="text-warning"
          iconBg="bg-warning/10"
        />
      </div>

      {/* Chart + Recent bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="xl:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-white">Booking Activity</h2>
              <p className="text-surface-500 text-xs mt-0.5">Last 7 days</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#e8ff47" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e8ff47" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fafafa', fontSize: '12px' }}
                  cursor={{ stroke: 'rgba(232,255,71,0.2)' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#e8ff47"
                  strokeWidth={2}
                  fill="url(#accentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Recent bookings */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Recent Bookings</h2>
            <Link to="/dashboard/bookings" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              View all <RiArrowRightLine />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <RiCalendarLine className="text-4xl text-surface-600 mb-3" />
              <p className="text-surface-400 text-sm">No bookings yet</p>
              <p className="text-surface-600 text-xs mt-1">Share your booking link to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-surface-900 rounded-xl border border-white/6">
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {b.customerName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{b.customerName}</p>
                    <p className="text-xs text-surface-500 truncate">{b.serviceName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-accent">{formatCurrency(b.servicePrice)}</p>
                    <span className={`text-xs ${STATUS_COLORS[b.status] || 'badge-muted'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={RiServiceLine}
          title="Add a Service"
          desc="Set up a new service with pricing"
          to="/dashboard/services"
          color="accent"
        />
        <QuickAction
          icon={RiCalendarLine}
          title="View All Bookings"
          desc="Manage upcoming and past bookings"
          to="/dashboard/bookings"
          color="cyan"
        />
        <QuickAction
          icon={RiTimeLine}
          title="Business Settings"
          desc="Update info, domain & payment keys"
          to="/dashboard/settings"
          color="success"
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`text-lg ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <RiArrowUpLine /> : <RiArrowDownLine />}
          </div>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value text-2xl">{value}</p>
      <p className="stat-change">{sub}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, title, desc, to, color }) {
  const colorMap = {
    accent:  { bg: 'bg-accent/8 hover:bg-accent/12 border-accent/20',  icon: 'text-accent'     },
    cyan:    { bg: 'bg-cyan-accent/8 hover:bg-cyan-accent/12 border-cyan-accent/20', icon: 'text-cyan-accent' },
    success: { bg: 'bg-success/8 hover:bg-success/12 border-success/20', icon: 'text-success'  },
  }
  const c = colorMap[color] || colorMap.accent
  return (
    <Link to={to} className={`flex items-center gap-4 p-4 rounded-xl border ${c.bg} transition-all duration-200 group`}>
      <div className={`w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center ${c.icon}`}>
        <Icon className="text-xl" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">{title}</p>
        <p className="text-xs text-surface-500">{desc}</p>
      </div>
      <RiArrowRightLine className="ml-auto text-surface-500 group-hover:text-white transition-colors" />
    </Link>
  )
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="text-center">
        <RiCalendarLine className="text-4xl text-surface-700 mx-auto mb-2" />
        <p className="text-surface-500 text-sm">No activity yet</p>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="skeleton h-10 w-72 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 skeleton h-72 rounded-xl" />
        <div className="xl:col-span-2 skeleton h-72 rounded-xl" />
      </div>
    </div>
  )
}

function buildChartData(bookings) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({
      day: format(d, 'EEE'),
      bookings: bookings.filter(b => {
        const bd = b.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || ''
        return bd === key
      }).length,
    })
  }
  return days
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatCurrency(amount) {
  return `KES ${Number(amount || 0).toLocaleString()}`
}
