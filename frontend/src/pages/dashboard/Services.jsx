import { useState } from 'react'
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine,
  RiTimeLine, RiMoneyDollarCircleLine, RiServiceLine,
  RiToggleLine, RiToggleFill,
} from 'react-icons/ri'
import { useAuth } from '@/context/AuthContext'
import { addService, updateService, deleteService } from '@/lib/firestore'
import toast from 'react-hot-toast'

const CURRENCIES   = ['KES', 'USD', 'NGN', 'GHS', 'ZAR']
const DURATIONS    = [15, 30, 45, 60, 90, 120, 180, 240]

const EMPTY_FORM = { name: '', description: '', duration: 60, price: '', currency: 'KES', isActive: true }

export default function Services() {
  const { user, clientData, refreshClient } = useAuth()
  const [modalOpen, setModalOpen]   = useState(false)
  const [editService, setEditSvc]   = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)

  const services = clientData?.services || []

  function openAdd() {
    setEditSvc(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(svc) {
    setEditSvc(svc)
    setForm({ name: svc.name, description: svc.description, duration: svc.duration, price: svc.price, currency: svc.currency, isActive: svc.isActive })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required')
      return
    }
    setSaving(true)
    try {
      if (editService) {
        await updateService(user.uid, editService.id, form)
        toast.success('Service updated!')
      } else {
        await addService(user.uid, form)
        toast.success('Service added!')
      }
      await refreshClient()
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(svc) {
    if (!confirm(`Delete "${svc.name}"? This cannot be undone.`)) return
    setDeleting(svc.id)
    try {
      await deleteService(user.uid, svc.id)
      await refreshClient()
      toast.success('Service deleted')
    } catch {
      toast.error('Failed to delete service')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleActive(svc) {
    try {
      await updateService(user.uid, svc.id, { isActive: !svc.isActive })
      await refreshClient()
    } catch {
      toast.error('Failed to update service')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Services</h1>
          <p className="section-subtitle">{services.length} service{services.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start">
          <RiAddLine /> Add Service
        </button>
      </div>

      {/* Services grid */}
      {services.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center">
          <RiServiceLine className="text-5xl text-surface-600 mb-4" />
          <p className="text-white font-semibold mb-1">No services yet</p>
          <p className="text-surface-500 text-sm mb-6">Add your first service to start accepting bookings.</p>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <RiAddLine /> Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(svc => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={toggleActive}
              deleting={deleting === svc.id}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <ServiceModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          isEdit={!!editService}
          saving={saving}
        />
      )}
    </div>
  )
}

function ServiceCard({ service: svc, onEdit, onDelete, onToggle, deleting }) {
  return (
    <div className={`card p-5 flex flex-col gap-4 transition-all ${!svc.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-lg truncate">{svc.name}</h3>
          {svc.description && (
            <p className="text-surface-400 text-sm mt-1 line-clamp-2">{svc.description}</p>
          )}
        </div>
        <button
          onClick={() => onToggle(svc)}
          className={`ml-2 flex-shrink-0 text-2xl transition-colors ${svc.isActive ? 'text-accent' : 'text-surface-600'}`}
          title={svc.isActive ? 'Deactivate' : 'Activate'}
        >
          {svc.isActive ? <RiToggleFill /> : <RiToggleLine />}
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-surface-400">
          <RiTimeLine className="text-surface-500" />
          <span>{svc.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-accent font-medium">
          <RiMoneyDollarCircleLine />
          <span>{svc.currency} {Number(svc.price).toLocaleString()}</span>
        </div>
      </div>

      {!svc.isActive && (
        <span className="badge-muted self-start">Inactive</span>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-white/6">
        <button
          onClick={() => onEdit(svc)}
          className="btn-ghost flex items-center gap-1.5 text-xs flex-1 justify-center"
        >
          <RiEditLine /> Edit
        </button>
        <button
          onClick={() => onDelete(svc)}
          disabled={deleting}
          className="btn-danger flex items-center gap-1.5 text-xs flex-1 justify-center py-1.5"
        >
          {deleting ? (
            <div className="w-3 h-3 rounded-full border border-danger border-t-transparent animate-spin" />
          ) : (
            <RiDeleteBinLine />
          )}
          Delete
        </button>
      </div>
    </div>
  )
}

function ServiceModal({ form, setForm, onSave, onClose, isEdit, saving }) {
  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-800 border border-white/10 rounded-2xl shadow-modal animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="font-display font-semibold text-white">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose} className="btn-icon"><RiCloseLine /></button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="input-label">Service Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => field('name', e.target.value)}
              placeholder="e.g. Haircut, Manicure, Room Booking"
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={form.description}
              onChange={e => field('description', e.target.value)}
              placeholder="Brief description of the service..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Duration</label>
              <select
                value={form.duration}
                onChange={e => field('duration', Number(e.target.value))}
                className="input-field"
              >
                {DURATIONS.map(d => (
                  <option key={d} value={d}>{d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Price *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => field('price', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="input-label">Currency</label>
            <div className="flex gap-2 flex-wrap">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => field('currency', c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    form.currency === c
                      ? 'bg-accent text-surface-950'
                      : 'bg-surface-700 text-surface-400 border border-white/8 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-surface-900 rounded-xl px-4 py-3 border border-white/6">
            <div>
              <p className="text-sm text-white font-medium">Active</p>
              <p className="text-xs text-surface-500">Customers can book this service</p>
            </div>
            <button
              type="button"
              onClick={() => field('isActive', !form.isActive)}
              className={`text-3xl transition-colors ${form.isActive ? 'text-accent' : 'text-surface-600'}`}
            >
              {form.isActive ? <RiToggleFill /> : <RiToggleLine />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 rounded-full border-2 border-surface-950 border-t-transparent animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
