import { Router }  from 'express'
import { getAccessToken } from '../services/mpesa.js'

const router = Router()

/**
 * GET /api/health
 * Service health check
 */
router.get('/', (req, res) => {
  res.json({
    status:  'ok',
    service: 'bookflow-backend',
    version: '1.0.0',
    time:    new Date().toISOString(),
    env:     process.env.NODE_ENV,
    mpesa: {
      env:      process.env.MPESA_ENV || 'sandbox',
      shortcode: process.env.MPESA_SHORTCODE ? '✓ set' : '✗ missing',
      callback:  process.env.MPESA_CALLBACK_URL || '✗ missing',
      credentials: (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET)
        ? '✓ set'
        : '✗ missing',
    },
  })
})

/**
 * GET /api/health/mpesa
 * Test M-Pesa token generation
 */
router.get('/mpesa', async (req, res) => {
  try {
    await getAccessToken()
    res.json({ status: 'ok', message: 'M-Pesa token obtained successfully' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
