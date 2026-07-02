import { Link } from 'react-router-dom'
import {
  RiCalendarLine, RiShieldCheckLine, RiGlobalLine,
  RiArrowRightLine, RiCheckLine, RiFlashlightLine,
  RiPieChartLine, RiSmartphoneLine,
} from 'react-icons/ri'

const features = [
  {
    icon: RiCalendarLine,
    title: 'Smart Booking System',
    desc: 'Clients book services 24/7. Real-time availability, automatic confirmations, and zero double-bookings.',
  },
  {
    icon: RiShieldCheckLine,
    title: 'Integrated Payments',
    desc: 'Accept Paystack card payments and M-Pesa STK Push. Booking is only confirmed after payment.',
  },
  {
    icon: RiGlobalLine,
    title: 'Custom Domains',
    desc: 'Each business gets their own booking page. Map your own domain for a fully branded experience.',
  },
  {
    icon: RiPieChartLine,
    title: 'Business Analytics',
    desc: 'Track revenue, bookings, and growth from a clean, real-time dashboard.',
  },
  {
    icon: RiFlashlightLine,
    title: 'Instant Setup',
    desc: 'Go live in minutes. Sign in with Google, add your services, and start accepting bookings.',
  },
  {
    icon: RiSmartphoneLine,
    title: 'Mobile First',
    desc: 'Your booking page looks perfect on every device. No app download required.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    features: ['1 business profile', 'Up to 50 bookings/mo', 'Paystack payments', 'Subdomain booking page'],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'KES 2,500',
    period: 'per month',
    features: ['Unlimited bookings', 'M-Pesa STK Push', 'Custom domain', 'Advanced analytics', 'Priority support'],
    cta: 'Start Pro Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: ['White-label platform', 'API access', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/6">
        <div className="page-container flex items-center justify-between h-16">
          <LogoMark />
          <div className="hidden md:flex items-center gap-6 text-sm text-surface-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
            <Link to="/login" className="btn-primary">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Grid bg */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="page-container relative text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-8 animate-fade-in">
            <RiFlashlightLine />
            <span>Multi-tenant booking platform for African businesses</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6 animate-slide-up">
            Bookings &<br />
            <span className="text-gradient-accent">Payments</span>
            <br />Automated.
          </h1>

          <p className="text-surface-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            One platform for salons, stays, studios, and services. Accept M-Pesa and card payments.
            Get your booking page live in 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/login" className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base">
              Launch Your Booking Page
              <RiArrowRightLine />
            </Link>
            <a href="#features" className="btn-secondary flex items-center gap-2 px-8 py-3.5 text-base">
              See How It Works
            </a>
          </div>

          <p className="text-surface-500 text-sm mt-6">
            No credit card required · Free forever plan available
          </p>
        </div>

        {/* Hero visual */}
        <div className="page-container mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <DashboardPreview />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 border-t border-white/6">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="font-display font-bold text-4xl text-white">Everything you need to run your business</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover p-6 group" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-xl mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 border-t border-white/6">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="font-display font-bold text-4xl text-white">Simple, transparent pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl border transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-accent/5 border-accent/40 shadow-glow-accent'
                    : 'bg-surface-800 border-white/8'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1.5 bg-accent text-surface-950 text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display font-bold text-white text-xl mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display font-extrabold text-4xl text-white">{plan.price}</span>
                </div>
                <p className="text-surface-400 text-sm mb-6">{plan.period}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-surface-300">
                      <RiCheckLine className="text-accent flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={plan.highlight ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-12 px-4">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
          <LogoMark />
          <p className="text-surface-500 text-sm">© 2025 BookFlow. Built for businesses in Africa.</p>
          <div className="flex items-center gap-4 text-sm text-surface-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
        <RiCalendarLine className="text-surface-950 text-base" />
      </div>
      <span className="font-display font-bold text-white text-lg">BookFlow</span>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-900 overflow-hidden shadow-modal">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-800 border-b border-white/8">
        <div className="w-3 h-3 rounded-full bg-danger/60" />
        <div className="w-3 h-3 rounded-full bg-warning/60" />
        <div className="w-3 h-3 rounded-full bg-success/60" />
        <span className="text-surface-500 text-xs ml-2 font-mono">bookflow.app/dashboard</span>
      </div>
      {/* Dashboard mockup */}
      <div className="p-6 grid grid-cols-3 gap-4">
        {[
          { label: 'BOOKINGS THIS MONTH', value: '124', color: 'text-accent' },
          { label: 'REVENUE (KES)',        value: '48,200', color: 'text-cyan-accent' },
          { label: 'SERVICES ACTIVE',     value: '8',      color: 'text-success' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-800 rounded-xl p-4 border border-white/6">
            <p className="text-surface-500 text-xs tracking-widest uppercase mb-2">{s.label}</p>
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6 space-y-2">
        {['Haircut — John Kamau — KES 500', 'Manicure — Grace Wanjiru — KES 800', 'Room 2 — Abubakar Hassan — KES 3,500'].map((b, i) => (
          <div key={i} className="flex items-center justify-between bg-surface-800 rounded-lg px-4 py-3 border border-white/6">
            <span className="text-surface-300 text-sm">{b}</span>
            <span className="badge-success">Paid</span>
          </div>
        ))}
      </div>
    </div>
  )
}
