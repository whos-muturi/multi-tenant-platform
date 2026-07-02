import { Router } from 'express'
import { stkPush, stkQuery, processCallback, getCallbackResult } from '../services/mpesa.js'

const router = Router()

/**
 * POST /api/mpesa/stkpush
 * Initiate M-Pesa STK Push payment
 */
router.post('/stkpush', async (req, res) => {
  const { phone, amount, accountRef, description } = req.body

  // Validation
  if (!phone || !amount) {
    return res.status(400).json({ error: 'phone and amount are required' })
  }

  if (isNaN(amount) || amount <= 0 || amount > 300000) {
    return res.status(400).json({ error: 'amount must be between 1 and 300,000' })
  }

  // Validate Kenyan phone format
  const phoneRegex = /^254[17]\d{8}$/
  if (!phoneRegex.test(String(phone))) {
    return res.status(400).json({
      error: 'Invalid phone number. Must be in format 254XXXXXXXXX (Safaricom only)',
    })
  }

  try {
    const result = await stkPush({
      phone:       String(phone),
      amount:      Number(amount),
      accountRef:  accountRef  || 'BookFlow',
      description: description || 'Booking Payment',
    })

    if (result.ResponseCode !== '0') {
      return res.status(400).json({
        error: result.ResponseDescription || 'STK push failed',
        code:  result.ResponseCode,
      })
    }

    return res.json({
      success:          true,
      message:          result.CustomerMessage || 'STK Push sent. Check your phone.',
      CheckoutRequestID: result.CheckoutRequestID,
      MerchantRequestID: result.MerchantRequestID,
    })
  } catch (err) {
    console.error('[M-Pesa STK Push Error]', err.response?.data || err.message)
    return res.status(500).json({
      error: err.response?.data?.errorMessage || err.message || 'M-Pesa request failed',
    })
  }
})

/**
 * POST /api/mpesa/callback
 * Receives M-Pesa payment confirmation from Safaricom
 * Must be publicly accessible (HTTPS)
 */
router.post('/callback', (req, res) => {
  console.log('[M-Pesa Callback]', JSON.stringify(req.body, null, 2))

  try {
    const result = processCallback(req.body)
    console.log('[M-Pesa Callback Processed]', result)
    // Safaricom expects a 200 response immediately
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('[M-Pesa Callback Error]', err.message)
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }) // Always 200 to Safaricom
  }
})

/**
 * GET /api/mpesa/status/:checkoutRequestId
 * Check payment status — polled by frontend
 */
router.get('/status/:checkoutRequestId', async (req, res) => {
  const { checkoutRequestId } = req.params

  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'checkoutRequestId is required' })
  }

  // First check Firestore callback store
  const cached = await getCallbackResult(checkoutRequestId)
  if (cached) {
    return res.json({
      paid: cached.paid,
      failed: !cached.paid,
      resultCode: cached.resultCode,
      resultDesc: cached.resultDesc,
      mpesaRef: cached.mpesaRef,
    })
  }

  // Otherwise query Daraja directly
  try {
    const result = await stkQuery(checkoutRequestId)

    // ResultCode 0 = success, 1032 = cancelled, 17 = insufficient funds
    const paid   = result.ResultCode === '0' || result.ResultCode === 0
    const failed = ['1032', '17', '1', '2001'].includes(String(result.ResultCode))

    return res.json({
      paid,
      failed,
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc || result.ResponseDescription,
    })
  } catch (err) {
    // If query fails (transaction still pending), return pending
    console.error('[M-Pesa Status Error]', err.response?.data || err.message)
    return res.json({ paid: false, failed: false, pending: true })
  }
})

export default router
