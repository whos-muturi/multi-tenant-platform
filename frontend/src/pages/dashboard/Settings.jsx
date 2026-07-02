import { useState, useEffect } from 'react'
import {
  RiSave3Line, RiGlobalLine, RiLockLine,
  RiClipboardLine, RiExternalLinkLine, RiShieldCheckLine,
  RiInfoLine,
} from 'react-icons/ri'
import { useAuth } from '@/context/AuthContext'
import { updateClient } from '@/lib/firestore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, clientData, refreshClient } = useAuth()
  const [tab, setTab] = useState('business')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Manage your business profile and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 p-1 rounded-xl border border-white/6 w-fit">
        {['business', 'domain', 'payments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? 'bg-surface-700 text-white shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'business'  && <BusinessSettings user={user} clientData={clientData} onSaved={refreshClient} />}
      {tab === 'domain'    && <DomainSettings   user={user} clientData={clientData} onSaved={refreshClient} />}
      {tab === 'payments'  && <PaymentSettings  user={user} clientData={clientData} onSaved={refreshClient} />}
    </div>
  )
}

/* ─── Business Settings ─────────────────────────────────────── */

function BusinessSettings({ user, clientData, onSaved }) {
  const [form, setForm]     = useState({ businessName: '', email: '', phone: '', description: '', logoUrl: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clientData) {
      setForm({
        businessName: clientData.businessName || '',
        email:        clientData.email        || '',
        phone:        clientData.phone        || '',
        description:  clientData.description  || '',
        logoUrl:      clientData.logoUrl      || '',
      })
    }
  }, [clientData])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.businessName.trim()) { toast.error('Business name is required'); return }
    setSaving(true)
    try {
      await updateClient(user.uid, form)
      await onSaved()
      toast.success('Business profile updated!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="card p-6 space-y-5 max-w-2xl">
      <h2 className="font-display font-semibold text-white">Business Profile</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Business Name *</label>
          <input type="text" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} className="input-field" required />
        </div>
        <div>
          <label className="input-label">Contact Email</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="input-label">Phone Number</label>
          <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+254..." className="input-field" />
        </div>
        <div>
          <label className="input-label">Logo URL</label>
          <input type="url" value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." className="input-field" />
        </div>
      </div>

      <div>
        <label className="input-label">Business Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe your business..." className="input-field resize-none" />
      </div>

      <div className="bg-surface-900 rounded-xl p-4 border border-white/6 flex items-start gap-3">
        <RiInfoLine className="text-accent flex-shrink-0 mt-0.5" />
        <div className="text-xs text-surface-400">
          <p className="text-white font-medium mb-1">Your Booking Page ID</p>
          <p className="font-mono text-accent break-all">{user?.uid}</p>
          <p className="mt-1">Share this link: <span className="text-white">{window.location.origin}/book/{user?.uid}</span></p>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
        {saving && <div className="w-4 h-4 rounded-full border-2 border-surface-950 border-t-transparent animate-spin" />}
        <RiSave3Line /> Save Changes
      </button>
    </form>
  )
}

/* ─── Domain Settings ───────────────────────────────────────── */

function DomainSettings({ user, clientData, onSaved }) {
  const [domain, setDomain] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clientData?.domain) setDomain(clientData.domain)
  }, [clientData])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClient(user.uid, { domain: domain.trim().toLowerCase() })
      await onSaved()
      toast.success('Domain saved!')
    } catch {
      toast.error('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  const defaultUrl = `${window.location.origin}/book/${user?.uid}`

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <RiGlobalLine className="text-accent text-xl" />
          <h2 className="font-display font-semibold text-white">Custom Domain</h2>
        </div>

        {/* Default URL */}
        <div className="bg-surface-900 rounded-xl p-4 border border-white/6">
          <p className="text-xs text-surface-500 mb-1">Default Booking URL</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-white font-mono truncate">{defaultUrl}</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { navigator.clipboard.writeText(defaultUrl); toast.success('Copied!') }}
                className="btn-icon text-xs"
              >
                <RiClipboardLine />
              </button>
              <a href={defaultUrl} target="_blank" rel="noreferrer" className="btn-icon text-xs">
                <RiExternalLinkLine />
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Custom Domain</label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="mybusiness.com"
              className="input-field"
            />
            <p className="text-xs text-surface-500 mt-1">
              Enter your domain without https:// (e.g. mybusiness.com)
            </p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 rounded-full border-2 border-surface-950 border-t-transparent animate-spin" />}
            <RiSave3Line /> Save Domain
          </button>
        </form>
      </div>

      {/* DNS instructions */}
      <div className="card p-5 border-accent/20">
        <h3 className="font-medium text-white mb-3 flex items-center gap-2"><RiInfoLine className="text-accent" /> DNS Setup Instructions</h3>
        <div className="space-y-2 text-sm text-surface-400">
          <p>To point your domain to BookFlow, add these DNS records at your registrar:</p>
          <div className="bg-surface-900 rounded-lg p-3 font-mono text-xs space-y-1.5 border border-white/6 mt-2">
            <p><span className="text-accent">CNAME</span> <span className="text-white">www</span> → bookflow.app</p>
            <p><span className="text-accent">A</span>     <span className="text-white">@</span>   → 76.76.21.21</p>
          </div>
          <p className="text-xs">DNS changes can take up to 48 hours to propagate.</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Payment Settings ──────────────────────────────────────── */

function PaymentSettings({ user, clientData, onSaved }) {
  const [form, setForm]     = useState({ paystackKey: '', mpesaEnabled: false })
  const [saving, setSaving] = useState(false)
  const [show, setShow]     = useState(false)

  useEffect(() => {
    if (clientData) {
      setForm({
        paystackKey:   clientData.paystackKey   || '',
        mpesaEnabled:  clientData.mpesaEnabled  || false,
      })
    }
  }, [clientData])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClient(user.uid, form)
      await onSaved()
      toast.success('Payment settings saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
      {/* Paystack */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <span className="text-blue-400 font-bold text-xs">PS</span>
          </div>
          <div>
            <h2 className="font-display font-semibold text-white">Paystack</h2>
            <p className="text-xs text-surface-500">Card payments via Paystack</p>
          </div>
        </div>

        <div>
          <label className="input-label">Paystack Public Key</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={form.paystackKey}
              onChange={e => setForm(p => ({ ...p, paystackKey: e.target.value }))}
              placeholder="pk_live_..."
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white"
            >
              <RiLockLine />
            </button>
          </div>
          <p className="text-xs text-surface-500 mt-1">
            Found in your Paystack dashboard under Settings → API Keys & Webhooks.
            Only use the <span className="text-accent">public</span> key here.
          </p>
        </div>
      </div>

      {/* M-Pesa */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <span className="text-green-400 font-bold text-xs">MP</span>
            </div>
            <div>
              <h2 className="font-display font-semibold text-white">M-Pesa (Daraja)</h2>
              <p className="text-xs text-surface-500">STK Push via Safaricom</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.mpesaEnabled}
              onChange={e => setForm(p => ({ ...p, mpesaEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer
                            peer-checked:after:translate-x-full peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:rounded-full after:h-5 after:w-5
                            after:transition-all peer-checked:bg-accent" />
          </label>
        </div>

        <div className="bg-surface-900 rounded-xl p-4 border border-white/6 flex items-start gap-3">
          <RiShieldCheckLine className="text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-surface-400">
            M-Pesa credentials (Consumer Key, Consumer Secret, Passkey, Shortcode) are stored securely
            in your backend environment variables — never in the browser. Configure them in your
            <span className="text-white"> backend/.env</span> file.
          </p>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
        {saving && <div className="w-4 h-4 rounded-full border-2 border-surface-950 border-t-transparent animate-spin" />}
        <RiSave3Line /> Save Payment Settings
      </button>
    </form>
  )
}
