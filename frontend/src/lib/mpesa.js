const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Initiate M-Pesa STK Push via backend.
 * Phone should be in format: 254XXXXXXXXX
 */
export async function initiateMpesaPayment({ phone, amount, bookingRef, clientId }) {
  const formattedPhone = formatPhone(phone)

  const res = await fetch(`${API_BASE}/api/mpesa/stkpush`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone:      formattedPhone,
      amount:     Math.round(amount),
      accountRef: bookingRef || `BF${Date.now()}`,
      description: `BookFlow Payment - ${clientId}`,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'M-Pesa request failed' }))
    throw new Error(err.message || 'M-Pesa request failed')
  }

  return res.json()
}

/**
 * Poll for M-Pesa payment status.
 */
export async function checkMpesaStatus(checkoutRequestId) {
  const res = await fetch(`${API_BASE}/api/mpesa/status/${checkoutRequestId}`)
  if (!res.ok) throw new Error('Failed to check payment status')
  return res.json()
}

/**
 * Format phone number to Safaricom format: 2547XXXXXXXX
 */
function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('+254')) return cleaned.slice(1)
  return `254${cleaned}`
}
