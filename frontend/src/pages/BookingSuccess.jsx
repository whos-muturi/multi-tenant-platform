import { useLocation, Link } from 'react-router-dom'
import { RiCheckboxCircleFill, RiCalendarLine, RiTimeLine, RiDownloadLine, RiHomeLine } from 'react-icons/ri'

export default function BookingSuccess() {
  const { state } = useLocation()

  if (!state) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-surface-400 mb-4">No booking information found.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  const { bookingId, service, date, time, customer, client } = state

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-12">
      {/* Confetti-style glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-64 h-64 bg-cyan-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center animate-pulse-accent">
              <RiCheckboxCircleFill className="text-5xl text-accent" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl text-white mb-2">Booking Confirmed!</h1>
          <p className="text-surface-400 text-sm">
            Your booking at <span className="text-white">{client?.businessName}</span> has been confirmed and paid.
          </p>
        </div>

        {/* Booking details card */}
        <div className="bg-surface-800 border border-white/10 rounded-2xl overflow-hidden shadow-modal">
          {/* Header stripe */}
          <div className="bg-accent/8 border-b border-accent/20 px-5 py-3 flex items-center justify-between">
            <span className="text-accent text-xs font-mono font-medium">Booking ID</span>
            <span className="text-accent text-xs font-mono">{bookingId?.slice(0, 12).toUpperCase()}</span>
          </div>

          <div className="p-5 space-y-3">
            <Row label="Service">
              <span className="text-white font-semibold">{service?.name}</span>
            </Row>
            <Row label="Date">
              <div className="flex items-center gap-1.5 text-white">
                <RiCalendarLine className="text-accent text-sm" />
                {date}
              </div>
            </Row>
            <Row label="Time">
              <div className="flex items-center gap-1.5 text-white">
                <RiTimeLine className="text-accent text-sm" />
                {time}
              </div>
            </Row>
            <div className="divider" />
            <Row label="Name">{customer?.name}</Row>
            <Row label="Email">{customer?.email}</Row>
            <Row label="Phone">{customer?.phone}</Row>
            <div className="divider" />
            <Row label="Amount Paid">
              <span className="font-display font-bold text-xl text-accent">
                {service?.currency} {Number(service?.price).toLocaleString()}
              </span>
            </Row>
            <Row label="Status">
              <span className="badge-success">Confirmed & Paid</span>
            </Row>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => window.print()}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <RiDownloadLine /> Save / Print Receipt
          </button>
          <Link
            to={`/book/${state.bookingId?.slice(0, 28)}`}
            className="btn-ghost w-full flex items-center justify-center gap-2 text-center"
          >
            Book Another Appointment
          </Link>
        </div>

        <p className="text-center text-surface-500 text-xs mt-6">
          A confirmation has been noted for <span className="text-surface-400">{customer?.email}</span>.
          Please contact the business if you need to make changes.
        </p>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-surface-500">{label}</span>
      <span className="text-surface-300">{children}</span>
    </div>
  )
}
