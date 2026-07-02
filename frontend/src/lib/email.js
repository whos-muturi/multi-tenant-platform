const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(bookingData) {
  const response = await fetch(`${API_BASE}/email/booking-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })
  if (!response.ok) throw new Error('Failed to send confirmation email')
  return response.json()
}

/**
 * Send booking notification to business
 */
export async function sendBusinessNotificationEmail(bookingData) {
  const response = await fetch(`${API_BASE}/email/business-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })
  if (!response.ok) throw new Error('Failed to send business notification')
  return response.json()
}