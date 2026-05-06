// src/hooks/useCustomerData.js

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

import {
  subscribeToOrders,
  addOrder          as fsAddOrder,
  updateOrder       as fsUpdateOrder,
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
  subscribeToMeasurements,
  addMeasurement    as fsAddMeasurement,
  deleteMeasurement as fsDeleteMeasurement,
} from '../services/measurementService'

export function useCustomerData(customerId) {
  const { user } = useAuth()

  const [measurements,        setMeasurements]        = useState([])
  const [orders,              setOrders]              = useState([])
  const [invoices,            setInvoices]            = useState([])
  const [measurementsLoading, setMeasurementsLoading] = useState(true)
  const [ordersLoading,       setOrdersLoading]       = useState(true)
  const [invoicesLoading,     setInvoicesLoading]     = useState(true) 

  useEffect(() => {
    if (!user || !customerId) {
      setMeasurements([])
      setOrders([])
      setInvoices([])
      setMeasurementsLoading(false)
      setOrdersLoading(false)
      setInvoicesLoading(false)
      
      return
    }

    setMeasurementsLoading(true)
    setOrdersLoading(true)
    setInvoicesLoading(true) 

    const unsubMeas = subscribeToMeasurements(
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
    (data) => { setInvoices(data); setInvoicesLoading(false) },       // ← add setter
    (err)  => { console.error('[useCustomerData] invoices:', err); setInvoicesLoading(false) }  // ← add setter
  )

    return () => {
      unsubMeas()
      unsubOrders()
      unsubInvoices()
    }
  }, [user, customerId])

  // ── MEASUREMENTS ─────────────────────────────────────────

  const saveMeasurement = useCallback(async (entry) => {
    if (!user || !customerId) return
    try {
      const { id: _localId, ...data } = entry
      await fsAddMeasurement(user.uid, customerId, data)
    } catch (err) {
      console.error('[useCustomerData] saveMeasurement:', err)
      throw err
    }
  }, [user, customerId])

  const deleteMeasurement = useCallback(async (id) => {
    if (!user || !customerId) return
    try {
      await fsDeleteMeasurement(user.uid, customerId, String(id))
    } catch (err) {
      console.error('[useCustomerData] deleteMeasurement:', err)
      throw err
    }
  }, [user, customerId])

  // ── ORDERS ───────────────────────────────────────────────

  const saveOrder = useCallback(async (order) => {
    if (!user || !customerId) return
    try {
      const { id: _localId, ...data } = order
      await fsAddOrder(user.uid, customerId, data)
    } catch (err) {
      console.error('[useCustomerData] saveOrder:', err)
      throw err
    }
  }, [user, customerId])

  const updateOrderStatus = useCallback(async (id, status) => {
    if (!user || !customerId) return
    try {
      await fsUpdateOrderStatus(user.uid, customerId, String(id), status)
    } catch (err) {
      console.error('[useCustomerData] updateOrderStatus:', err)
      throw err
    }
  }, [user, customerId])

  const deleteOrder = useCallback(async (id) => {
    if (!user || !customerId) return
    try {
      await fsDeleteOrder(user.uid, customerId, String(id))
    } catch (err) {
      console.error('[useCustomerData] deleteOrder:', err)
      throw err
    }
  }, [user, customerId])

  // ── INVOICES ─────────────────────────────────────────────

  const saveInvoice = useCallback(async (invoice) => {
    if (!user || !customerId) return
    try {
      await fsAddInvoice(user.uid, customerId, invoice)
    } catch (err) {
      console.error('[useCustomerData] saveInvoice:', err)
      throw err
    }
  }, [user, customerId])

  const updateInvoiceStatus = useCallback(async (id, status) => {
    if (!user || !customerId) return
    try {
      await fsUpdateInvoiceStatus(user.uid, customerId, String(id), status)
    } catch (err) {
      console.error('[useCustomerData] updateInvoiceStatus:', err)
      throw err
    }
  }, [user, customerId])

  const deleteInvoice = useCallback(async (id) => {
    if (!user || !customerId) return
    try {
      await fsDeleteInvoice(user.uid, customerId, String(id))
    } catch (err) {
      console.error('[useCustomerData] deleteInvoice:', err)
      throw err
    }
  }, [user, customerId])


  return {
    measurements, saveMeasurement, deleteMeasurement, measurementsLoading,
    orders,       saveOrder,       updateOrderStatus,  deleteOrder,        ordersLoading,
    invoices,     saveInvoice,     updateInvoiceStatus, deleteInvoice,     invoicesLoading, 
  }
}