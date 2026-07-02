import axios from 'axios'
import admin from 'firebase-admin'

const SANDBOX_URL    = 'https://sandbox.safaricom.co.ke'
const PRODUCTION_URL = 'https://api.safaricom.co.ke'

function getBaseUrl() {
  return process.env.MPESA_ENV === 'production' ? PRODUCTION_URL : SANDBOX_URL
}

// In-memory token cache
let tokenCache = { token: null, expiresAt: 0 }

/**
 * Get a fresh OAuth2 access token from Safaricom Daraja.
 * Caches the token until 60s before expiry.
 */
export async function getAccessToken() {
  const now = Date.now()
  if (tokenCache.token && now < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const consumerKey    = process.env.MPESA_CONSUMER_KEY
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.')
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const res = await axios.get(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    timeout: 10000,
  })

  const token     = res.data.access_token
  const expiresIn = parseInt(res.data.expires_in, 10) * 1000

  tokenCache = {
    token,
    expiresAt: now + expiresIn - 60000, // Expire 60s early for safety
  }

  return token
}

/**
 * Generate the M-Pesa password for STK Push.
 * Format: Base64(Shortcode + Passkey + Timestamp)
 */
function generatePassword(timestamp) {
  const shortcode = process.env.MPESA_SHORTCODE
  const passkey   = process.env.MPESA_PASSKEY
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

/**
 * Get current timestamp in Daraja format: YYYYMMDDHHmmss
 */
function getTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)
}

/**
 * Initiate an STK Push request to the customer's phone.
 * @param {object} params
 * @param {string} params.phone        - Phone number in format 2547XXXXXXXX
 * @param {number} params.amount       - Amount in KES (whole number)
 * @param {string} params.accountRef   - Account reference (shown on M-Pesa prompt)
 * @param {string} params.description  - Transaction description
 */
export async function stkPush({ phone, amount, accountRef, description }) {
  const maxRetries = 3
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token     = await getAccessToken()
      const timestamp = getTimestamp()
      const password  = generatePassword(timestamp)
      const shortcode = process.env.MPESA_SHORTCODE
      const callback  = process.env.MPESA_CALLBACK_URL

      if (!shortcode || !callback) {
        throw new Error('MPESA_SHORTCODE or MPESA_CALLBACK_URL not configured')
      }

      const payload = {
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         timestamp,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.round(amount),
        PartyA:            phone,
        PartyB:            shortcode,
        PhoneNumber:       phone,
        CallBackURL:       callback,
        AccountReference:  accountRef.slice(0, 12), // Max 12 chars
        TransactionDesc:   description.slice(0, 13),  // Max 13 chars
      }

      const res = await axios.post(
        `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )

      return res.data
    } catch (err) {
      lastError = err
      console.error(`[M-Pesa STK Push Attempt ${attempt}/${maxRetries}]`, err.message)
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
      }
    }
  }

  throw lastError
}

/**
 * Query the status of an STK Push transaction.
 * @param {string} checkoutRequestId - From the original STK push response
 */
export async function stkQuery(checkoutRequestId) {
  const token     = await getAccessToken()
  const timestamp = getTimestamp()
  const password  = generatePassword(timestamp)
  const shortcode = process.env.MPESA_SHORTCODE

  const res = await axios.post(
    `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  )

  return res.data
}

// In-memory store for callback results (in production, use Redis/Firestore)
export const callbackStore = new Map()

/**
 * Process M-Pesa callback payload and store result in Firestore.
 */
export async function processCallback(body) {
  const stk = body?.Body?.stkCallback
  if (!stk) throw new Error('Invalid callback payload')

  const { CheckoutRequestID, ResultCode, ResultDesc } = stk
  const paid = ResultCode === 0

  let mpesaRef = null
  if (paid && stk.CallbackMetadata?.Item) {
    const refItem = stk.CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber')
    mpesaRef = refItem?.Value || null
  }

  const callbackData = {
    checkoutRequestId: CheckoutRequestID,
    paid,
    resultCode: ResultCode,
    resultDesc: ResultDesc,
    mpesaRef,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  // Store in Firestore
  await admin.firestore().collection('mpesa_callbacks').doc(CheckoutRequestID).set(callbackData)

  return { paid, mpesaRef, resultDesc: ResultDesc }
}

/**
 * Get callback result from Firestore.
 */
export async function getCallbackResult(checkoutRequestId) {
  const doc = await admin.firestore().collection('mpesa_callbacks').doc(checkoutRequestId).get()
  return doc.exists ? doc.data() : null
}
