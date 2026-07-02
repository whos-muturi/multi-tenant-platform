import { Link } from 'react-router-dom'
import { RiArrowLeftLine } from 'react-icons/ri'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <p className="font-display font-extrabold text-[120px] leading-none text-surface-800 select-none">404</p>
        <h1 className="font-display font-bold text-2xl text-white mb-2 -mt-4">Page Not Found</h1>
        <p className="text-surface-400 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <RiArrowLeftLine /> Back to Home
        </Link>
      </div>
    </div>
  )
}
