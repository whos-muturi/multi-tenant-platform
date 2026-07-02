# BookFlow — Multi-Tenant Booking & Payment SaaS

A production-ready multi-tenant booking platform for African businesses. Salons, barbershops, Airbnb hosts, studios — any appointment-based business can go live in minutes.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS      |
| Backend     | Node.js + Express                   |
| Database    | Firebase Firestore                  |
| Auth        | Firebase Authentication (Google)    |
| Payments    | Paystack (cards) + M-Pesa (STK Push)|
| Deployment  | Vercel / Firebase Hosting + Cloud Run |

---

## Project Structure

```
bookflow/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # DashboardLayout, AdminLayout
│   │   │   └── ui/             # Shared UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Firebase auth state
│   │   ├── lib/
│   │   │   ├── firebase.js     # Firebase init
│   │   │   ├── firestore.js    # All DB operations
│   │   │   ├── paystack.js     # Paystack inline payment
│   │   │   └── mpesa.js        # M-Pesa API client
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── BookingPage.jsx         # Public booking flow
│   │   │   ├── BookingSuccess.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Overview.jsx        # Stats + charts
│   │   │   │   ├── Bookings.jsx        # Booking management
│   │   │   │   ├── Services.jsx        # Service CRUD
│   │   │   │   └── Settings.jsx        # Profile, domain, payments
│   │   │   └── admin/
│   │   │       ├── AdminOverview.jsx   # Platform stats
│   │   │       ├── AdminClients.jsx    # All clients
│   │   │       └── AdminBookings.jsx   # All bookings
│   │   └── styles/
│   │       └── globals.css
│   ├── .env.example
│   └── package.json
│
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── index.js            # Express server
│   │   ├── routes/
│   │   │   ├── mpesa.js        # STK Push + callback + status
│   │   │   └── health.js       # Health check
│   │   └── services/
│   │       └── mpesa.js        # Daraja API service
│   ├── .env.example
│   └── package.json
│
├── firebase/
│   ├── firestore.rules         # Security rules
│   └── firestore.indexes.json  # Composite indexes
│
├── firebase.json               # Firebase project config
└── README.md
```

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourname/bookflow.git
cd bookflow

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `bookflow-prod`)
3. Enable **Firestore** (production mode)
4. Enable **Authentication** → Google Sign-In provider
5. Go to **Project Settings** → **Your apps** → Add a Web app
6. Copy the config values

### 3. Frontend Environment Variables

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:5000
VITE_ADMIN_UID=your_firebase_uid
```

To find your Firebase UID: sign in to the app once, then check Firebase Console → Authentication → Users.

### 4. Deploy Firestore Rules & Indexes

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set your project
firebase use yourproject-id

# Update your admin UID in firebase/firestore.rules first!
# Replace YOUR_ADMIN_UID_HERE with your actual Firebase UID

# Deploy rules and indexes
firebase deploy --only firestore
```

### 5. Backend Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-backend.run.app/api/mpesa/callback
MPESA_ENV=sandbox
CORS_ORIGINS=http://localhost:3000
```

**For local M-Pesa callbacks:** use [ngrok](https://ngrok.com)
```bash
ngrok http 5000
# Copy the HTTPS URL and set as MPESA_CALLBACK_URL
```

### 6. Run in Development

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev    # http://localhost:3000

# Terminal 2 — Backend
cd backend && npm run dev     # http://localhost:5000
```

---

## Paystack Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
4. Paste it in `frontend/.env.local` as `VITE_PAYSTACK_PUBLIC_KEY`
5. The **Secret Key** stays on your backend (not needed for this integration)

---

## M-Pesa (Daraja) Setup

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app under **My Apps**
3. Under **APIs** → subscribe to **M-Pesa Express (Sandbox)**
4. Copy Consumer Key and Consumer Secret
5. For the Passkey (sandbox): use `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
6. Shortcode for sandbox: `174379`

**Going to production:**
- Apply for a Safaricom paybill/till number
- Get production credentials from the portal
- Change `MPESA_ENV=production`

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Option A: Vercel CLI
npx vercel --prod

# Option B: Firebase Hosting
firebase deploy --only hosting
```

Set all `VITE_*` environment variables in Vercel project settings.

### Backend → Google Cloud Run

```bash
cd backend

# Build and deploy
gcloud run deploy bookflow-backend \
  --source . \
  --region africa-south1 \
  --allow-unauthenticated \
  --set-env-vars MPESA_ENV=production,...
```

Or deploy to Railway, Render, Fly.io — any Node.js host works.

---

## Custom Domain Setup

1. In your dashboard → Settings → Domain, enter your domain (e.g. `mybusiness.com`)
2. At your DNS registrar, add:
   ```
   CNAME  www  →  bookflow.app
   A      @    →  76.76.21.21
   ```
3. The booking page at `mybusiness.com` will automatically load the correct client

---

## Multi-Tenancy Architecture

Each business (client) is identified by their Firebase UID (`clientId`):

```
Firestore
├── clients/
│   ├── {uid_1}/   ← Business A data
│   └── {uid_2}/   ← Business B data
└── bookings/
    ├── {bookingId}/  → clientId: uid_1
    └── {bookingId}/  → clientId: uid_2
```

Firestore security rules ensure clients can **only read/write their own data**.

Public booking URLs: `/book/:clientId`

Custom domains detected via `window.location.hostname` → matched against `clients.domain`.

---

## Security Checklist

- [x] Firestore rules enforce per-client data isolation
- [x] Admin routes protected by UID check
- [x] Paystack public key only — no secret in browser
- [x] M-Pesa credentials only in backend `.env`
- [x] Booking only saved AFTER successful payment confirmation
- [x] Rate limiting on STK Push endpoint (5 req/min)
- [x] CORS whitelist on backend
- [x] Helmet security headers
- [x] Input validation on all payment endpoints

---

## Adding a New Client (Business)

1. Business owner visits `/login`
2. Signs in with Google
3. Client document auto-created in Firestore with their `uid`
4. They add services, configure payments in Settings
5. Their booking page is live at `/book/{uid}`

No manual provisioning needed — fully self-serve.

---

## License

MIT — build on it, sell it, ship it.
