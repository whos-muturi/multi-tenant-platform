import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RiGoogleLine, RiCalendarLine, RiArrowLeftLine } from 'react-icons/ri'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect
  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Welcome to BookFlow!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Sign-in failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white text-sm mb-8 transition-colors group">
          <RiArrowLeftLine className="group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-surface-800 border border-white/8 rounded-2xl p-8 shadow-modal">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <RiCalendarLine className="text-surface-950 text-xl" />
            </div>
            <span className="font-display font-bold text-white text-xl">BookFlow</span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-bold text-2xl text-white mb-2">Welcome back</h1>
          <p className="text-surface-400 text-sm mb-8">
            Sign in to access your booking dashboard and manage your business.
          </p>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900
                       font-body font-semibold text-sm py-3.5 px-5 rounded-xl
                       hover:bg-gray-100 active:scale-95 transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            ) : (
              <RiGoogleLine className="text-lg text-[#4285f4]" />
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-surface-500 text-xs">Secure sign-in</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Info */}
          <div className="bg-surface-900 border border-white/6 rounded-xl p-4 space-y-2">
            {[
              'Your business profile is created automatically',
              'Manage bookings and services from your dashboard',
              'Accept payments via Paystack & M-Pesa',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-surface-400">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-surface-500 text-xs mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-surface-400 hover:text-white underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-surface-400 hover:text-white underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
