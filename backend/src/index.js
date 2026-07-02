import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import helmet       from 'helmet'
import morgan       from 'morgan'
import rateLimit    from 'express-rate-limit'
import admin        from 'firebase-admin'
import mpesaRoutes  from './routes/mpesa.js'
import healthRoutes from './routes/health.js'
import emailRoutes  from './routes/email.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Firebase Admin ───────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet())

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman, M-Pesa callbacks)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ─── Rate Limiting ────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
})

const stkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      5,
  message:  { error: 'Too many payment requests. Please wait a moment.' },
})

app.use('/api/', apiLimiter)
app.use('/api/mpesa/stkpush', stkLimiter)

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/mpesa',  mpesaRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/email',  emailRoutes)

// ─── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'BookFlow Backend',
    version: '1.0.0',
    status:  'running',
    time:    new Date().toISOString(),
  })
})

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message })
  }
  res.status(err.status || 500).json({
    error:   process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 BookFlow Backend running on port ${PORT}`)
  console.log(`   ENV:      ${process.env.NODE_ENV}`)
  console.log(`   M-Pesa:   ${process.env.MPESA_ENV || 'sandbox'}`)
  console.log(`   Callback: ${process.env.MPESA_CALLBACK_URL}\n`)
})

export default app
