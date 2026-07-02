import { useState, useEffect } from 'react'
import { RiSearchLine, RiDownloadLine, RiCalendarLine } from 'react-icons/ri'
import { getAllBookings } from '@/lib/firestore'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getAllBookings(500).then(b => { setBookings(b); setLoading(false) })
  }, [])

  const filtered = bookings.filter(b =>
    !search ||
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
    b.clientId?.includes(search)
  )

  const totalRevenue = filtered
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.servicePrice || 0), 0)

  function exportCSV() {
    const headers = ['Booking ID', 'Client ID', 'Customer', 'Email', 'Service', 'Date', 'Time', 'Amount', 'Payment Method', 'Status']
    const rows = filtered.map(b => [
      b.id, b.clientId, b.customerName, b.customerEmail,
      b.serviceName, b.date, b.time, b.servicePrice, b.paymentMethod, b.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'all-bookings.csv'; a.click()
  }

  if (loading) return <div className="skeleton h-96 rounded-xl" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">All Bookings</h1>
          <p className="section-subtitle">
            {bookings.length} total · KES {totalRevenue.toLocaleString()} revenue
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 self-start">
          <RiDownloadLine /> Export CSV
        </button>
      </div>

      <div className="relative max-w-sm">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, service, client..."
          className="input-field pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center">
          <RiCalendarLine className="text-5xl text-surface-600 mb-4" />
          <p className="text-surface-400">No bookings found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white-6">
                  {['Customer', 'Service', 'Client ID', 'Date', 'Amount', 'Method', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-widest text-surface-500 font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-white">{b.customerName}</p>
                      <p className="text-xs text-surface-500">{b.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-surface-300">{b.serviceName}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-surface-400">{b.clientId?.slice(0, 10)}...</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-surface-300 whitespace-nowrap">{b.date} {b.time}</td>
                    <td className="px-5 py-3 font-mono text-sm text-accent whitespace-nowrap">
                      KES {Number(b.servicePrice || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge capitalize ${b.paymentMethod === 'paystack' ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' : 'bg-green-500/10 text-green-400 border-green-400/20'}`}>
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge capitalize ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
