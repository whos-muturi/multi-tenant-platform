import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RiCalendarLine, RiTimeLine, RiUserLine, RiArrowRightLine,
  RiArrowLeftLine, RiCheckLine, RiCloseLine, RiPhoneLine,
  RiMailLine, RiLockLine, RiLoaderLine,
} from 'react-icons/ri'
import { getClient, getBookedSlots, createBooking } from '@/lib/firestore'
import { initiatePaystackPayment } from '@/lib/paystack'
import { initiateMpesaPayment, checkMpesaStatus } from '@/lib/mpesa'
import { sendBookingConfirmationEmail, sendBusinessNotificationEmail } from '@/lib/email'
import { format, addDays, startOfDay, isBefore } from 'date-fns'
import toast from 'react-hot-toast'

const STEPS = ['Service', 'Date & Time', 'Your Info', 'Payment', 'Confirm']

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
]

export default function BookingPage() {
  const { clientId } = useParams()
  const navigate     = useNavigate()

  const [client,   setClient]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step,     setStep]     = useState(0)
  const [service,  setService]  = useState(null)
  const [date,     setDate]     = useState('')
  const [time,     setTime]     = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [form,     setForm]     = useState({ name: '', email: '', phone: '', notes: '' })
  const [payMethod, setPayMethod] = useState('paystack')
  const [paying,   setPaying]   = useState(false)

  // Domain-based tenant detection
  useEffect(() => {
    async function loadClient() {
      try {
        let id = clientId
        if (!id) {
          const hostname = window.location.hostname
          if (hostname !== 'localhost' && !hostname.includes('bookflow')) {
            const { getClientByDomain } = await import('@/lib/firestore')
            const found = await getClientByDomain(hostname)
            if (found) id = found.id
          }
        }
        if (!id) { setNotFound(true); return }
        const data = await getClient(id)
        if (!data) { setNotFound(true); return }
        setClient(data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [clientId])

  // Load booked slots when date changes
  useEffect(() => {
    if (!date || !clientId) return
    getBookedSlots(clientId, date).then(setBookedSlots)
  }, [date, clientId])

  // Generate date options (next 30 days, skip past days)
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i)
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE, MMM d'),
      day:   format(d, 'EEE'),
      date:  format(d, 'd'),
      month: format(d, 'MMM'),
    }
  })

  function next() { setStep(s => Math.min(s + 1, 4)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function handlePayAndBook() {
    setPaying(true)
    try {
      let paymentRef = ''

      if (payMethod === 'paystack') {
        const res = await initiatePaystackPayment({
          email:    form.email,
          amount:   service.price,
          currency: service.currency || 'KES',
          metadata: { serviceName: service.name, clientId },
        })
        paymentRef = res.reference
      } else if (payMethod === 'mpesa') {
        const stkRes = await initiateMpesaPayment({
          phone:      form.phone,
          amount:     service.price,
          bookingRef: `BF${Date.now()}`,
          clientId,
        })
        if (!stkRes.CheckoutRequestID) throw new Error('M-Pesa push failed')

        // Poll for confirmation
        toast('Check your phone for M-Pesa prompt...', { icon: '📱' })
        let confirmed = false
        for (let i = 0; i < 12; i++) {
          await sleep(5000)
          const status = await checkMpesaStatus(stkRes.CheckoutRequestID)
          if (status.paid) { confirmed = true; paymentRef = stkRes.CheckoutRequestID; break }
          if (status.failed) throw new Error('M-Pesa payment failed or cancelled')
        }
        if (!confirmed) throw new Error('M-Pesa payment timed out')
      }

      // Save booking
      const bookingId = await createBooking({
        clientId,
        serviceId:     service.id,
        serviceName:   service.name,
        servicePrice:  service.price,
        currency:      service.currency || 'KES',
        customerName:  form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        date,
        time,
        notes:         form.notes,
        paymentMethod: payMethod,
        paymentRef,
      })

      // Send confirmation emails (don't fail booking if email fails)
      try {
        await Promise.all([
          sendBookingConfirmationEmail({
            to: form.email,
            customerName: form.name,
            serviceName: service.name,
            date: format(new Date(date), 'PPP'),
            time,
            businessName: client.businessName,
            bookingId,
          }),
          sendBusinessNotificationEmail({
            to: client.email,
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
            serviceName: service.name,
            date: format(new Date(date), 'PPP'),
            time,
            businessName: client.businessName,
            bookingId,
          }),
        ])
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr)
        // Don't show error to user, booking is successful
      }

      navigate('/booking/success', {
        state: { bookingId, service, date, time, customer: form, client },
      })
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') {
        toast.error(err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  if (loading)  return <FullLoader />
  if (notFound) return <NotFound />

  const activeServices = client.services?.filter(s => s.isActive) || []

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="bg-surface-900 border-b border-white-6 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {client.logoUrl ? (
            <img src={client.logoUrl} alt={client.businessName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <RiCalendarLine className="text-surface-950 text-sm" />
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">{client.businessName}</h1>
            {client.description && <p className="text-surface-500 text-xs">{client.description}</p>}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-surface-900 border-b border-white-6 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? 'bg-accent text-surface-950' :
                    i === step ? 'bg-accent/20 text-accent border border-accent/40' :
                    'bg-surface-700 text-surface-500'
                  }`}>
                    {i < step ? <RiCheckLine /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === step ? 'text-accent' : 'text-surface-500'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-accent' : 'bg-surface-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-fade-in">

          {/* Step 0: Service */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-2xl text-white">Choose a Service</h2>
              {activeServices.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="text-surface-400">No services available at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServices.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => { setService(svc); next() }}
                      className={`w-full text-left card p-5 hover:border-accent/40 hover:bg-surface-700/50 transition-all group ${service?.id === svc.id ? 'border-accent/40 bg-accent/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-white group-hover:text-accent transition-colors">{svc.name}</h3>
                          {svc.description && <p className="text-surface-400 text-sm mt-1">{svc.description}</p>}
                          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                            <span className="flex items-center gap-1"><RiTimeLine />{svc.duration} min</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-display font-bold text-xl text-accent">{svc.currency} {Number(svc.price).toLocaleString()}</p>
                          <RiArrowRightLine className="text-surface-500 group-hover:text-accent ml-auto mt-1 transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={back} className="btn-icon"><RiArrowLeftLine /></button>
                <h2 className="font-display font-bold text-2xl text-white">Pick a Date</h2>
              </div>

              {/* Date picker */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {dateOptions.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { setDate(d.value); setTime('') }}
                    className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                      date === d.value
                        ? 'bg-accent border-accent text-surface-950'
                        : 'bg-surface-800 border-white-8 hover:border-white-20 text-white'
                    }`}
                  >
                    <span className="text-xs opacity-70">{d.day}</span>
                    <span className="font-display font-bold text-lg leading-tight">{d.date}</span>
                    <span className="text-xs opacity-70">{d.month}</span>
                  </button>
                ))}
              </div>

              {/* Time slots */}
              {date && (
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <RiTimeLine className="text-accent" /> Available Times
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(t => {
                      const booked = bookedSlots.includes(t)
                      return (
                        <button
                          key={t}
                          disabled={booked}
                          onClick={() => setTime(t)}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                            booked ? 'bg-surface-800 text-surface-600 cursor-not-allowed line-through border border-white-4' :
                            time === t ? 'bg-accent text-surface-950 border border-accent' :
                            'bg-surface-800 text-white border border-white-8 hover:border-white-20'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={next}
                disabled={!date || !time}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue <RiArrowRightLine />
              </button>
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={back} className="btn-icon"><RiArrowLeftLine /></button>
                <h2 className="font-display font-bold text-2xl text-white">Your Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Kamau" className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Email Address *</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Phone Number *</label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+254 700 000 000" className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any special requests..." rows={2} className="input-field resize-none" />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!form.name || !form.email || !form.phone) { toast.error('Please fill in all required fields'); return }
                  next()
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue <RiArrowRightLine />
              </button>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={back} className="btn-icon"><RiArrowLeftLine /></button>
                <h2 className="font-display font-bold text-2xl text-white">Payment</h2>
              </div>

              {/* Summary */}
              <div className="card p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-surface-400">Service</span><span className="text-white">{service?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-surface-400">Date</span><span className="text-white">{date}</span></div>
                <div className="flex justify-between text-sm"><span className="text-surface-400">Time</span><span className="text-white">{time}</span></div>
                <div className="divider my-2" />
                <div className="flex justify-between"><span className="text-white font-semibold">Total</span><span className="font-display font-bold text-xl text-accent">{service?.currency} {Number(service?.price).toLocaleString()}</span></div>
              </div>

              {/* Payment method */}
              <div>
                <p className="input-label mb-3">Payment Method</p>
                <div className="space-y-2">
                  <PayMethodBtn
                    id="paystack"
                    label="Card Payment"
                    sub="Visa, Mastercard via Paystack"
                    selected={payMethod === 'paystack'}
                    onSelect={() => setPayMethod('paystack')}
                    color="bg-blue-500/10 border-blue-400/20"
                    tag="blue"
                  />
                  <PayMethodBtn
                    id="mpesa"
                    label="M-Pesa"
                    sub="STK Push to your Safaricom number"
                    selected={payMethod === 'mpesa'}
                    onSelect={() => setPayMethod('mpesa')}
                    color="bg-green-500/10 border-green-400/20"
                    tag="green"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-900 rounded-xl p-3 border border-white-6">
                <RiLockLine className="text-accent flex-shrink-0" />
                <span>Your payment is secure and encrypted. Booking is confirmed only after successful payment.</span>
              </div>

              <button
                onClick={handlePayAndBook}
                disabled={paying}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
              >
                {paying ? (
                  <><RiLoaderLine className="animate-spin" /> Processing...</>
                ) : (
                  <><RiLockLine /> Pay {service?.currency} {Number(service?.price).toLocaleString()}</>
                )}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function PayMethodBtn({ id, label, sub, selected, onSelect, tag }) {
  const colors = {
    blue:  selected ? 'border-blue-400/60 bg-blue-500/10' : 'border-white/8 hover:border-blue-400/30',
    green: selected ? 'border-green-400/60 bg-green-500/10' : 'border-white/8 hover:border-green-400/30',
  }
  const dotColor = { blue: 'bg-blue-400', green: 'bg-green-400' }

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border bg-surface-800 transition-all ${colors[tag]}`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-accent' : 'border-surface-500'}`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-surface-500">{sub}</p>
      </div>
      <div className={`ml-auto w-2 h-2 rounded-full ${dotColor[tag]}`} />
    </button>
  )
}

function FullLoader() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-surface-400 text-sm">Loading booking page...</p>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Business Not Found</h1>
        <p className="text-surface-400 text-sm">This booking page doesn't exist or has been removed.</p>
      </div>
    </div>
  )
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
