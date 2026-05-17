import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

import {
  subscribeToMeasurements,
  addMeasurement    as addMeasurementToDb,
  deleteMeasurement as deleteMeasurementFromDb,
} from '../services/measurementService'

import {
  subscribeToCustomerOrders,
  addOrder          as addOrderToDb,
  updateOrderStatus as updateOrderStatusInDb,
  deleteOrder       as deleteOrderFromDb,
} from '../services/orderService'

import {
  subscribeToCustomerInvoices,
  addInvoice          as addInvoiceToDb,
  updateInvoiceStatus as updateInvoiceStatusInDb,
  deleteInvoice       as deleteInvoiceFromDb,
} from '../services/invoiceService'

import {
  subscribeToCustomerPayments,
  createPayment as fsCreatePayment,
  updatePayment as fsUpdatePayment,
  deletePayment as fsDeletePayment,
} from '../services/paymentService'

import {
  subscribeToReceipts,
  addReceipt    as fsAddReceipt,
  deleteReceipt as fsDeleteReceipt,
} from '../services/receiptService'


export function useCustomerData(customerId) {

  const { user } = useAuth()

  const [measurements, setMeasurements] = useState([])
  const [orders,       setOrders]       = useState([])
  const [invoices,     setInvoices]     = useState([])
  const [payments,     setPayments]     = useState([])
  const [receipts,     setReceipts]     = useState([])

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
      ()     => { setMeasurementsLoading(false) }
    )

    const unsubOrders = subscribeToCustomerOrders(
      user.uid, customerId,
      (data) => { setOrders(data); setOrdersLoading(false) },
      ()     => { setOrdersLoading(false) }
    )

    const unsubInvoices = subscribeToCustomerInvoices(
      user.uid, customerId,
      (data) => { setInvoices(data); setInvoicesLoading(false) },
      ()     => { setInvoicesLoading(false) }
    )

    const unsubPayments = subscribeToCustomerPayments(
      user.uid, customerId,
      (data) => { setPayments(data); setPaymentsLoading(false) },
      ()     => { setPaymentsLoading(false) }
    )

    const unsubReceipts = subscribeToReceipts(
      user.uid, customerId,
      (data) => { setReceipts(data); setReceiptsLoading(false) },
      ()     => { setReceiptsLoading(false) }
    )

    return () => {
      unsubMeasurements()
      unsubOrders()
      unsubInvoices()
      unsubPayments()
      unsubReceipts()
    }
  }, [user, customerId])


  // ── MEASUREMENTS ──────────────────────────────────────────────────────────

  const saveMeasurement = useCallback(async (entry) => {
    if (!user || !customerId) return
    const { id: _, ...data } = entry
    await addMeasurementToDb(user.uid, customerId, data)
  }, [user, customerId])

  const deleteMeasurement = useCallback(async (id) => {
    if (!user || !customerId) return
    await deleteMeasurementFromDb(user.uid, customerId, String(id))
  }, [user, customerId])


  // ── ORDERS ────────────────────────────────────────────────────────────────

  const saveOrder = useCallback(async (order) => {
    if (!user || !customerId) return
    const { id: _, ...data } = order
    return addOrderToDb(user.uid, customerId, data)
  }, [user, customerId])

  const updateOrderStatus = useCallback(async (id, status) => {
    if (!user) return
    await updateOrderStatusInDb(user.uid, String(id), status)
  }, [user])

  const deleteOrder = useCallback(async (id) => {
    if (!user) return
    await deleteOrderFromDb(user.uid, String(id))
  }, [user])


  // ── INVOICES ──────────────────────────────────────────────────────────────

  const saveInvoice = useCallback(async (invoice) => {
    if (!user || !customerId) return
    await addInvoiceToDb(user.uid, customerId, invoice)
  }, [user, customerId])

  const updateInvoiceStatus = useCallback(async (id, status) => {
    if (!user) return
    await updateInvoiceStatusInDb(user.uid, String(id), status)
  }, [user])

  const deleteInvoice = useCallback(async (id) => {
    if (!user) return
    await deleteInvoiceFromDb(user.uid, String(id))
  }, [user])


  // ── PAYMENTS ──────────────────────────────────────────────────────────────

  const savePayment = useCallback(async (data) => {
    if (!user || !customerId) return
    await fsCreatePayment(user.uid, customerId, data)
  }, [user, customerId])

  const updatePayment = useCallback(async (paymentId, data) => {
    if (!user) return
    await fsUpdatePayment(user.uid, paymentId, data)
  }, [user])

  const deletePayment = useCallback(async (paymentId) => {
    if (!user) return
    await fsDeletePayment(user.uid, paymentId)
  }, [user])


  // ── RECEIPTS ──────────────────────────────────────────────────────────────

  const saveReceipt = useCallback(async (data) => {
    if (!user || !customerId) return
    return fsAddReceipt(user.uid, customerId, data)
  }, [user, customerId])

  const deleteReceipt = useCallback(async (receiptId) => {
    if (!user || !customerId) return
    await fsDeleteReceipt(user.uid, customerId, receiptId)
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