import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation({
  to,
  customerName,
  serviceName,
  date,
  time,
  businessName,
  bookingId,
}) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL || 'noreply@bookflow.app',
    subject: `Booking Confirmed - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Hi ${customerName},</p>
        <p>Your booking has been confirmed!</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <p>Please arrive 10 minutes early.</p>
        <p>Thank you for choosing ${businessName}!</p>
      </div>
    `,
  }

  await sgMail.send(msg)
}

/**
 * Send booking notification to business
 */
export async function sendBusinessNotification({
  to,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  date,
  time,
  businessName,
  bookingId,
}) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL || 'noreply@bookflow.app',
    subject: `New Booking - ${customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Booking Received</h2>
        <p>You have a new booking!</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <p>Please check your dashboard for details.</p>
      </div>
    `,
  }

  await sgMail.send(msg)
}