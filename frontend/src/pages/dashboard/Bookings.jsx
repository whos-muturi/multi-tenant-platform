import { useState, useEffect } from 'react'
import {
  RiCalendarLine, RiSearchLine, RiFilterLine,
  RiDownloadLine, RiCheckLine, RiCloseLine, RiTimeLine,
  RiPhoneLine, RiMailLine, RiMoneyDollarCircleLine,
} from 'react-icons/ri'
import { useAuth } from '@/context/AuthContext'
import { subscribeToBookings, updateBookingStatus } from '@/lib/firestore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['all', 'confirmed', 'pending', 'cancelled']

export default function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToBookings(user.uid, (b) => {
      setBookings(b)
      setLoading(false)
    })
    return unsub
  }, [user])

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || b.status === filter
    return matchSearch && matchFilter
  })

  async function handleStatusChange(bookingId, status) {
    try {
      await updateBookingStatus(bookingId, status)
      toast.success(`Booking marked as ${status}`)
      if (selected?.id === bookingId) setSelected(prev => ({ ...prev, status }))
    } catch {
      toast.error('Failed to update booking')
    }
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Amount', 'Payment', 'Status']
    const rows = filtered.map(b => [
      b.customerName, b.customerEmail, b.customerPhone,
      b.serviceName, b.date, b.time,
      b.servicePrice, b.paymentMethod, b.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'bookings.csv'; a.click()
  }

  if (loading) return <BookingsSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Bookings</h1>
          <p className="section-subtitle">{bookings.length} total bookings</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 self-start">
          <RiDownloadLine /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === opt
                  ? 'bg-accent text-surface-950'
                  : 'bg-surface-800 text-surface-400 border border-white/8 hover:text-white hover:border-white/16'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <Empty />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6">
                  {['Customer', 'Service', 'Date & Time', 'Amount', 'Payment', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-widest text-surface-500 font-medium px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="hover:bg-surface-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {b.customerName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{b.customerName}</p>
                          <p className="text-xs text-surface-500">{b.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-surface-300">{b.serviceName}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{b.date}</p>
                      <p className="text-xs text-surface-500">{b.time}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-accent">
                      KES {Number(b.servicePrice || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <PaymentBadge method={b.paymentMethod} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(b) }}
                        className="text-xs text-surface-400 hover:text-white transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/4">
            {filtered.map(b => (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                className="p-4 hover:bg-surface-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{b.customerName}</p>
                    <p className="text-xs text-surface-500">{b.serviceName}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-surface-400">{b.date} · {b.time}</p>
                  <p className="text-sm font-mono text-accent">KES {Number(b.servicePrice || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

function BookingModal({ booking: b, onClose, onStatusChange }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-800 border border-white/10 rounded-2xl shadow-modal animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="font-display font-semibold text-white">Booking Details</h2>
          <button onClick={onClose} className="btn-icon"><RiCloseLine /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer */}
          <Section title="Customer">
            <Row icon={<RiCalendarLine />} label="Name"  value={b.customerName} />
            <Row icon={<RiMailLine />}     label="Email" value={b.customerEmail} />
            <Row icon={<RiPhoneLine />}    label="Phone" value={b.customerPhone} />
          </Section>

          {/* Booking */}
          <Section title="Booking">
            <Row icon={<RiServiceLine />} label="Service" value={b.serviceName} />
            <Row icon={<RiCalendarLine />} label="Date"   value={b.date} />
            <Row icon={<RiTimeLine />}     label="Time"   value={b.time} />
            {b.notes && <Row icon={<RiFilterLine />} label="Notes" value={b.notes} />}
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <Row icon={<RiMoneyDollarCircleLine />} label="Amount"  value={`KES ${Number(b.servicePrice || 0).toLocaleString()}`} accent />
            <Row icon={<RiCheckLine />}             label="Method"  value={b.paymentMethod} />
            <Row icon={<RiCheckLine />}             label="Ref"     value={b.paymentRef} mono />
            <Row icon={<RiCheckLine />}             label="Status"  value={b.paymentStatus} />
          </Section>

          {/* Status actions */}
          <div className="flex gap-2 pt-2">
            {b.status !== 'confirmed' && (
              <button
                onClick={() => onStatusChange(b.id, 'confirmed')}
                className="flex-1 flex items-center justify-center gap-2 bg-success/10 text-success border border-success/20 py-2 rounded-lg text-sm font-medium hover:bg-success/20 transition-colors"
              >
                <RiCheckLine /> Confirm
              </button>
            )}
            {b.status !== 'cancelled' && (
              <button
                onClick={() => onStatusChange(b.id, 'cancelled')}
                className="flex-1 flex items-center justify-center gap-2 bg-danger/10 text-danger border border-danger/20 py-2 rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors"
              >
                <RiCloseLine /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-surface-500 font-medium mb-2">{title}</p>
      <div className="bg-surface-900 rounded-xl border border-white/6 divide-y divide-white/4">
        {children}
      </div>
    </div>
  )
}

function Row({ icon, label, value, accent, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2 text-surface-500 text-xs">
        {icon}<span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${accent ? 'text-accent' : 'text-white'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { confirmed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger' }
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>
}

function PaymentBadge({ method }) {
  const map = { paystack: 'bg-blue-500/10 text-blue-400 border-blue-400/20', mpesa: 'bg-green-500/10 text-green-400 border-green-400/20' }
  return (
    <span className={`badge capitalize ${map[method] || 'badge-muted'}`}>{method || '—'}</span>
  )
}

function Empty() {
  return (
    <div className="card p-16 flex flex-col items-center text-center">
      <RiCalendarLine className="text-5xl text-surface-600 mb-4" />
      <p className="text-white font-semibold mb-1">No bookings found</p>
      <p className="text-surface-500 text-sm">Share your booking link to start receiving bookings.</p>
    </div>
  )
}

function BookingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-48 rounded-xl" />
      <div className="skeleton h-12 rounded-xl" />
      <div className="skeleton h-96 rounded-xl" />
    </div>
  )
}
