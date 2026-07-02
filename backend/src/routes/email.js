import { Router } from 'express'
import { sendBookingConfirmation, sendBusinessNotification } from '../services/email.js'

const router = Router()

/**
 * POST /api/email/booking-confirmation
 * Send booking confirmation email to customer
 */
router.post('/booking-confirmation', async (req, res) => {
  const { to, customerName, serviceName, date, time, businessName, bookingId } = req.body

  if (!to || !customerName || !serviceName || !date || !time || !businessName || !bookingId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    await sendBookingConfirmation({ to, customerName, serviceName, date, time, businessName, bookingId })
    res.json({ success: true })
  } catch (err) {
    console.error('[Email Error]', err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

/**
 * POST /api/email/business-notification
 * Send booking notification to business
 */
router.post('/business-notification', async (req, res) => {
  const { to, customerName, customerEmail, customerPhone, serviceName, date, time, businessName, bookingId } = req.body

  if (!to || !customerName || !serviceName || !date || !time || !businessName || !bookingId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    await sendBusinessNotification({ to, customerName, customerEmail, customerPhone, serviceName, date, time, businessName, bookingId })
    res.json({ success: true })
  } catch (err) {
    console.error('[Email Error]', err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

export default router