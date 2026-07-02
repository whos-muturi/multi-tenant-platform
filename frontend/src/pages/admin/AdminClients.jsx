import { useState, useEffect } from 'react'
import { RiSearchLine, RiExternalLinkLine, RiTeamLine } from 'react-icons/ri'
import { getAllClients } from '@/lib/firestore'

export default function AdminClients() {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getAllClients().then(c => { setClients(c); setLoading(false) })
  }, [])

  const filtered = clients.filter(c =>
    !search ||
    c.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="skeleton h-96 rounded-xl" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Clients</h1>
          <p className="section-subtitle">{clients.length} registered businesses</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="input-field pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center">
          <RiTeamLine className="text-5xl text-surface-600 mb-4" />
          <p className="text-surface-400">No clients found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-white/6">
                {['Business', 'Email', 'Phone', 'Plan', 'Services', 'Booking Page', 'Joined'].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-widest text-surface-500 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                          {c.businessName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <p className="text-sm text-white font-medium">{c.businessName || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-surface-400">{c.email || '—'}</td>
                  <td className="px-5 py-4 text-sm text-surface-400">{c.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize ${c.plan === 'pro' ? 'badge-accent' : 'badge-muted'}`}>{c.plan || 'free'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-white">{c.services?.length || 0}</td>
                  <td className="px-5 py-4">
                    <a
                      href={`/book/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      View Page <RiExternalLinkLine />
                    </a>
                  </td>
                  <td className="px-5 py-4 text-xs text-surface-500">
                    {c.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-white/4">
            {filtered.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{c.businessName}</p>
                  <p className="text-xs text-surface-500">{c.email}</p>
                  <p className="text-xs text-surface-500">{c.services?.length || 0} services</p>
                </div>
                <a href={`/book/${c.id}`} target="_blank" rel="noreferrer" className="btn-icon">
                  <RiExternalLinkLine />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
