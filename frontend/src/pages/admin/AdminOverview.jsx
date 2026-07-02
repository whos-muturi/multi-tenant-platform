import { useState, useEffect } from 'react'
import {
  RiTeamLine, RiCalendarLine, RiMoneyDollarCircleLine,
  RiArrowRightLine, RiTrendingUpLine,
} from 'react-icons/ri'
import { Link } from 'react-router-dom'
import { getPlatformStats } from '@/lib/firestore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export default function AdminOverview() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlatformStats().then(s => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  )

  const revenueByClient = stats.clients.slice(0, 8).map(c => ({
    name: c.businessName?.split(' ')[0] || 'Unknown',
    bookings: stats.recentBookings.filter(b => b.clientId === c.id).length,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Platform Overview</h1>
        <p className="section-subtitle">Real-time stats across all clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Clients</span>
            <RiTeamLine className="text-accent text-xl" />
          </div>
          <p className="stat-value text-accent">{stats.totalClients}</p>
          <p className="stat-change">businesses on platform</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Bookings</span>
            <RiCalendarLine className="text-cyan-accent text-xl" />
          </div>
          <p className="stat-value text-cyan-accent">{stats.totalBookings}</p>
          <p className="stat-change">all time</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Platform Revenue</span>
            <RiMoneyDollarCircleLine className="text-success text-xl" />
          </div>
          <p className="stat-value text-success">KES {stats.totalRevenue.toLocaleString()}</p>
          <p className="stat-change">total processed</p>
        </div>
      </div>

      {/* Chart */}
      {revenueByClient.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-6">Bookings by Client</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByClient} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fafafa', fontSize: '12px' }}
              />
              <Bar dataKey="bookings" fill="#e8ff47" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <h2 className="font-display font-semibold text-white">Recent Bookings (Platform-wide)</h2>
          <Link to="/admin/bookings" className="text-xs text-accent flex items-center gap-1 hover:text-accent-hover">
            View all <RiArrowRightLine />
          </Link>
        </div>
        <div className="divide-y divide-white/4">
          {stats.recentBookings.length === 0 ? (
            <div className="p-10 text-center text-surface-500">No bookings yet.</div>
          ) : (
            stats.recentBookings.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-white">
                    {b.customerName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-white">{b.customerName}</p>
                    <p className="text-xs text-surface-500">{b.serviceName} · {b.clientId?.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-accent">KES {Number(b.servicePrice || 0).toLocaleString()}</p>
                  <p className="text-xs text-surface-500 capitalize">{b.paymentMethod}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
