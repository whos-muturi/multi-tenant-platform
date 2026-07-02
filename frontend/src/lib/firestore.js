import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, onSnapshot, getCountFromServer,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── ADMINS ─────────────────────────────────────────────────────────────────

export async function isUserAdmin(uid) {
  const snap = await getDoc(doc(db, 'admins', uid))
  return snap.exists()
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export async function createClient(uid, data) {
  const ref = doc(db, 'clients', uid)
  await setDoc(ref, {
    businessName: data.businessName || '',
    email:        data.email        || '',
    phone:        data.phone        || '',
    logoUrl:      data.logoUrl      || '',
    description:  data.description  || '',
    services:     [],
    domain:       '',
    plan:         'free',
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  }, { merge: true })
}

export async function getClient(clientId) {
  const snap = await getDoc(doc(db, 'clients', clientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateClient(clientId, data) {
  await updateDoc(doc(db, 'clients', clientId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getAllClients() {
  const snap = await getDocs(query(collection(db, 'clients'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getClientByDomain(domain) {
  const q = query(collection(db, 'clients'), where('domain', '==', domain))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export function subscribeToClient(clientId, callback) {
  return onSnapshot(doc(db, 'clients', clientId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

export async function addService(clientId, service) {
  const client = await getClient(clientId)
  const services = client?.services || []
  const newService = {
    id:          Date.now().toString(),
    name:        service.name,
    description: service.description || '',
    duration:    service.duration     || 60,
    price:       Number(service.price) || 0,
    currency:    service.currency      || 'KES',
    isActive:    true,
    createdAt:   new Date().toISOString(),
  }
  await updateDoc(doc(db, 'clients', clientId), {
    services:  [...services, newService],
    updatedAt: serverTimestamp(),
  })
  return newService
}

export async function updateService(clientId, serviceId, data) {
  const client = await getClient(clientId)
  const services = (client?.services || []).map(s =>
    s.id === serviceId ? { ...s, ...data } : s
  )
  await updateDoc(doc(db, 'clients', clientId), { services, updatedAt: serverTimestamp() })
}

export async function deleteService(clientId, serviceId) {
  const client = await getClient(clientId)
  const services = (client?.services || []).filter(s => s.id !== serviceId)
  await updateDoc(doc(db, 'clients', clientId), { services, updatedAt: serverTimestamp() })
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function createBooking(data) {
  const ref = await addDoc(collection(db, 'bookings'), {
    clientId:        data.clientId,
    serviceId:       data.serviceId,
    serviceName:     data.serviceName,
    servicePrice:    data.servicePrice,
    currency:        data.currency || 'KES',
    customerName:    data.customerName,
    customerEmail:   data.customerEmail,
    customerPhone:   data.customerPhone,
    date:            data.date,
    time:            data.time,
    notes:           data.notes || '',
    status:          'confirmed',
    paymentMethod:   data.paymentMethod,
    paymentRef:      data.paymentRef,
    paymentStatus:   'paid',
    createdAt:       serverTimestamp(),
  })
  return ref.id
}

export async function getBookingsByClient(clientId) {
  const q = query(
    collection(db, 'bookings'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllBookings(limitCount = 100) {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, 'bookings', bookingId), { status, updatedAt: serverTimestamp() })
}

export async function getBookingById(bookingId) {
  const snap = await getDoc(doc(db, 'bookings', bookingId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function subscribeToBookings(clientId, callback) {
  const q = query(
    collection(db, 'bookings'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── AVAILABILITY ────────────────────────────────────────────────────────────

export async function getBookedSlots(clientId, date) {
  const q = query(
    collection(db, 'bookings'),
    where('clientId', '==', clientId),
    where('date', '==', date),
    where('status', 'in', ['confirmed', 'pending'])
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().time)
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export async function getClientStats(clientId) {
  const bookings = await getBookingsByClient(clientId)
  const now      = new Date()
  const thisMonth = bookings.filter(b => {
    const d = b.createdAt?.toDate?.() || new Date(b.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const revenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.servicePrice || 0), 0)
  const monthRevenue = thisMonth
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.servicePrice || 0), 0)

  return {
    totalBookings:  bookings.length,
    monthBookings:  thisMonth.length,
    totalRevenue:   revenue,
    monthRevenue,
    recentBookings: bookings.slice(0, 5),
  }
}

export async function getPlatformStats() {
  const [clients, bookings] = await Promise.all([
    getAllClients(),
    getAllBookings(1000),
  ])
  const revenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.servicePrice || 0), 0)

  return {
    totalClients:   clients.length,
    totalBookings:  bookings.length,
    totalRevenue:   revenue,
    recentBookings: bookings.slice(0, 10),
    clients,
  }
}
