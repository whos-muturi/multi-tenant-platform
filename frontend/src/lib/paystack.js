const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

if (!PAYSTACK_PUBLIC_KEY) {
  console.warn('[Paystack] VITE_PAYSTACK_PUBLIC_KEY is not set. Payments will not work.')
}

/**
 * Opens Paystack inline payment popup.
 * Returns a promise that resolves with the payment reference on success,
 * or rejects if the user closes the popup.
 */
export function initiatePaystackPayment({ email, amount, currency = 'KES', metadata = {} }) {
  return new Promise((resolve, reject) => {
    if (typeof PaystackPop === 'undefined') {
      reject(new Error('Paystack script not loaded. Check your internet connection.'))
      return
    }

    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === 'pk_test_your_paystack_public_key_here') {
      reject(new Error('Paystack public key not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your .env.local'))
      return
    }

    const handler = PaystackPop.setup({
      key:      PAYSTACK_PUBLIC_KEY,
      email,
      amount:   Math.round(amount * 100), // Convert to kobo/cents
      currency,
      ref:      `BF_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: 'Platform',
            variable_name: 'platform',
            value: 'BookFlow',
          },
        ],
      },
      callback(response) {
        resolve(response)
      },
      onClose() {
        reject(new Error('Payment cancelled by user'))
      },
    })

    handler.openIframe()
  })
}
