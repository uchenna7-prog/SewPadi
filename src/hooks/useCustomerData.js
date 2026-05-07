// src/hooks/useCustomerData.js

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

import {
  subscribeToMeasurements,
  addMeasurement    as fsAddMeasurement,
  deleteMeasurement as fsDeleteMeasurement,
} from '../services/measurementService'

import {
  subscribeToOrders,
  addOrder          as fsAddOrder,
  updateOrderStatus as fsUpdateOrderStatus,
  deleteOrder       as fsDeleteOrder,
} from '../services/orderService'

import {
  subscribeToInvoices,
  addInvoice          as fsAddInvoice,
  updateInvoiceStatus as fsUpdateInvoiceStatus,
  deleteInvoice       as fsDeleteInvoice,
} from '../services/invoiceService'

import {
  subscribeToPayments,
  createPayment as fsCreatePayment,
  updatePayment as fsUpdatePayment,
  deletePayment as fsDeletePayment,
} from '../services/paymentService'

import {
  subscribeToReceipts,
  addReceipt    as fsAddReceipt,
  deleteReceipt as fsDeleteReceipt,
} from '../services/receiptService'


// ─────────────────────────────────────────────────────────────
// DATA SHAPES — every object structure stored in Firestore
// ─────────────────────────────────────────────────────────────
//
// MEASUREMENT
// {
//   id:        string   (Firestore doc id)
//   name:      string   e.g. "Ankara Gown"
//   fields:    object   e.g. { bust: "38", waist: "32", ... }
//   images:    string[] (download URLs)
//   createdAt: Timestamp
// }
//
// ORDER
// {
//   id:             string
//   customerId:     string
//   customerName:   string
//   desc:           string   e.g. "Wedding Gown"
//   status:         'pending' | 'in-progress' | 'completed' | 'delivered' | 'cancelled'
//   stage:          string   e.g. "sewing" (nullable)
//   priority:       'normal' | 'urgent' | 'vip'
//   items:          { name, price, qty, imgSrc }[]
//   price:          number   subtotal (sum of items)
//   totalAmount:    number   grand total (price + shipping - discount + tax)
//   shippingFee:    number
//   discountType:   'flat' | 'percent' | null
//   discountValue:  number
//   discountAmount: number
//   taxRate:        number
//   taxAmount:      number
//   dueDate:        string   'YYYY-MM-DD'
//   dueRaw:         string   'YYYY-MM-DD'
//   due:            string   formatted e.g. "May 7, 2026"
//   takenAt:        string   formatted date
//   notes:          string
//   measurementIds: string[]
//   createdAt:      Timestamp
// }
//
// INVOICE
// {
//   id:             string
//   orderId:        string
//   number:         string   e.g. "INV-001"
//   orderDesc:      string
//   status:         'unpaid' | 'part_paid' | 'paid' | 'overdue'
//   date:           string   formatted e.g. "May 7, 2026"
//   due:            string
//   items:          { name, price, qty }[]
//   price:          number   subtotal
//   totalAmount:    number   grand total
//   shippingFee:    number
//   discountType:   'flat' | 'percent' | null
//   discountValue:  number
//   discountAmount: number
//   taxRate:        number
//   taxAmount:      number
//   template:       string   e.g. "invoiceTemplate1"
//   brandSnapshot:  object   { name, tagline, phone, email, address, logo, ... }
//   linkedNames:    string[]
//   notes:          string
//   createdAt:      Timestamp
// }
//
// PAYMENT
// {
//   id:           string
//   orderId:      string
//   orderDesc:    string
//   orderPrice:   number   grand total (totalAmount ?? price) — used for progress/balance
//   orderItems:   { name, price, qty, imgSrc }[]
//   status:       'not_paid' | 'part' | 'paid'
//   installments: {
//                   id:     number  (Date.now())
//                   amount: number
//                   method: 'cash' | 'transfer' | 'card' | 'other'
//                   date:   string  formatted
//                 }[]
//   notes:        string
//   date:         string   formatted
//   createdAt:    Timestamp
// }
//
// RECEIPT
// {
//   id:                   string
//   paymentId:            string
//   orderId:              string
//   orderDesc:            string
//   orderPrice:           number   subtotal (legacy — prefer totalAmount)
//   totalAmount:          number   grand total
//   number:               string   e.g. "RCP-01-003"
//   date:                 string   formatted
//   items:                { name, price, qty, imgSrc }[]
//   payments:             { id, amount, method, date }[]
//   installmentIds:       string[]
//   previousInstallments: { id, amount, method, date }[]
//   previousPaid:         number
//   cumulativePaid:       number
//   isFullPayment:        boolean
//   balance:              number
//   shippingFee:          number
//   discountType:         'flat' | 'percent' | null
//   discountValue:        number
//   discountAmount:       number
//   taxRate:              number
//   taxAmount:            number
//   template:             string
//   brandSnapshot:        object
//   notes:                string
//   createdAt:            Timestamp
// }
//
// ─────────────────────────────────────────────────────────────


export function useCustomerData(customerId) {
  const { user } = useAuth()

  const [measurements,        setMeasurements]        = useState([])
  const [orders,              setOrders]              = useState([])
  const [invoices,            setInvoices]            = useState([])
  const [payments,            setPayments]            = useState([])
  const [receipts,            setReceipts]            = useState([])

  const [measurementsLoading, setMeasurementsLoading] = useState(true)
  const [ordersLoading,       setOrdersLoading]       = useState(true)
  const [invoicesLoading,     setInvoicesLoading]     = useState(true)
  const [paymentsLoading,     setPaymentsLoading]     = useState(true)
  const [receiptsLoading,     setReceiptsLoading]     = useState(true)

  useEffect(() => {
    if (!user || !customerId) {
      setMeasurements([])
      setOrders([])
      setInvoices([])
      setPayments([])
      setReceipts([])
      setMeasurementsLoading(false)
      setOrdersLoading(false)
      setInvoicesLoading(false)
      setPaymentsLoading(false)
      setReceiptsLoading(false)
      return
    }

    setMeasurementsLoading(true)
    setOrdersLoading(true)
    setInvoicesLoading(true)
    setPaymentsLoading(true)
    setReceiptsLoading(true)

    const unsubMeasurements = subscribeToMeasurements(
      user.uid, customerId,
      (data) => { setMeasurements(data); setMeasurementsLoading(false) },
      (err)  => { console.error('[useCustomerData] measurements:', err); setMeasurementsLoading(false) }
    )

    const unsubOrders = subscribeToOrders(
      user.uid, customerId,
      (data) => { setOrders(data); setOrdersLoading(false) },
      (err)  => { console.error('[useCustomerData] orders:', err); setOrdersLoading(false) }
    )

    const unsubInvoices = subscribeToInvoices(
      user.uid, customerId,
      (data) => { setInvoices(data); setInvoicesLoading(false) },
      (err)  => { console.error('[useCustomerData] invoices:', err); setInvoicesLoading(false) }
    )

    const unsubPayments = subscribeToPayments(
      user.uid, customerId,
      (data) => { setPayments(data); setPaymentsLoading(false) },
      (err)  => { console.error('[useCustomerData] payments:', err); setPaymentsLoading(false) }
    )

    const unsubReceipts = subscribeToReceipts(
      user.uid, customerId,
      (data) => { setReceipts(data); setReceiptsLoading(false) },
      (err)  => { console.error('[useCustomerData] receipts:', err); setReceiptsLoading(false) }
    )

    return () => {
      unsubMeasurements()
      unsubOrders()
      unsubInvoices()
      unsubPayments()
      unsubReceipts()
    }
  }, [user, customerId])


  // ── MEASUREMENTS ─────────────────────────────────────────

  const saveMeasurement = useCallback(async (entry) => {
    if (!user || !customerId) return
    const { id: _localId, ...data } = entry
    try { await fsAddMeasurement(user.uid, customerId, data) }
    catch (err) { console.error('[useCustomerData] saveMeasurement:', err); throw err }
  }, [user, customerId])

  const deleteMeasurement = useCallback(async (id) => {
    if (!user || !customerId) return
    try { await fsDeleteMeasurement(user.uid, customerId, String(id)) }
    catch (err) { console.error('[useCustomerData] deleteMeasurement:', err); throw err }
  }, [user, customerId])


  // ── ORDERS ───────────────────────────────────────────────

  const saveOrder = useCallback(async (order) => {
    if (!user || !customerId) return
    const { id: _localId, ...data } = order
    try { await fsAddOrder(user.uid, customerId, data) }
    catch (err) { console.error('[useCustomerData] saveOrder:', err); throw err }
  }, [user, customerId])

  const updateOrderStatus = useCallback(async (id, status) => {
    if (!user || !customerId) return
    try { await fsUpdateOrderStatus(user.uid, customerId, String(id), status) }
    catch (err) { console.error('[useCustomerData] updateOrderStatus:', err); throw err }
  }, [user, customerId])

  const deleteOrder = useCallback(async (id) => {
    if (!user || !customerId) return
    try { await fsDeleteOrder(user.uid, customerId, String(id)) }
    catch (err) { console.error('[useCustomerData] deleteOrder:', err); throw err }
  }, [user, customerId])


  // ── INVOICES ─────────────────────────────────────────────

  const saveInvoice = useCallback(async (invoice) => {
    if (!user || !customerId) return
    try { await fsAddInvoice(user.uid, customerId, invoice) }
    catch (err) { console.error('[useCustomerData] saveInvoice:', err); throw err }
  }, [user, customerId])

  const updateInvoiceStatus = useCallback(async (id, status) => {
    if (!user || !customerId) return
    try { await fsUpdateInvoiceStatus(user.uid, customerId, String(id), status) }
    catch (err) { console.error('[useCustomerData] updateInvoiceStatus:', err); throw err }
  }, [user, customerId])

  const deleteInvoice = useCallback(async (id) => {
    if (!user || !customerId) return
    try { await fsDeleteInvoice(user.uid, customerId, String(id)) }
    catch (err) { console.error('[useCustomerData] deleteInvoice:', err); throw err }
  }, [user, customerId])


  // ── PAYMENTS ─────────────────────────────────────────────

  const savePayment = useCallback(async (paymentData) => {
    if (!user || !customerId) return
    try { await fsCreatePayment(user.uid, customerId, paymentData) }
    catch (err) { console.error('[useCustomerData] savePayment:', err); throw err }
  }, [user, customerId])

  const updatePayment = useCallback(async (paymentId, paymentData) => {
    if (!user || !customerId) return
    try { await fsUpdatePayment(user.uid, customerId, paymentId, paymentData) }
    catch (err) { console.error('[useCustomerData] updatePayment:', err); throw err }
  }, [user, customerId])

  const deletePayment = useCallback(async (paymentId) => {
    if (!user || !customerId) return
    try { await fsDeletePayment(user.uid, customerId, paymentId) }
    catch (err) { console.error('[useCustomerData] deletePayment:', err); throw err }
  }, [user, customerId])


  // ── RECEIPTS ─────────────────────────────────────────────

  const saveReceipt = useCallback(async (receiptData) => {
    if (!user || !customerId) return
    try { return await fsAddReceipt(user.uid, customerId, receiptData) }
    catch (err) { console.error('[useCustomerData] saveReceipt:', err); throw err }
  }, [user, customerId])

  const deleteReceipt = useCallback(async (receiptId) => {
    if (!user || !customerId) return
    try { await fsDeleteReceipt(user.uid, customerId, receiptId) }
    catch (err) { console.error('[useCustomerData] deleteReceipt:', err); throw err }
  }, [user, customerId])


  return {
    measurements,  measurementsLoading,
    orders,        ordersLoading,
    invoices,      invoicesLoading,
    payments,      paymentsLoading,
    receipts,      receiptsLoading,

    saveMeasurement,
    deleteMeasurement,

    saveOrder,
    updateOrderStatus,
    deleteOrder,

    saveInvoice,
    updateInvoiceStatus,
    deleteInvoice,

    savePayment,
    updatePayment,
    deletePayment,

    saveReceipt,
    deleteReceipt,
  }
}