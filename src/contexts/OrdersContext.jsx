import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth }      from './AuthContext'
import { useCustomers } from './CustomerContext'
import {
  subscribeToOrders,
  addOrder          as addOrderToDb,
  updateOrder       as updateOrderInDb,
  updateOrderStatus as updateOrderStatusInDb,
  updateOrderStage  as updateOrderStageInDb,
  deleteOrder       as deleteOrderFromDb,
} from '../services/orderService'


const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {

  const { user }      = useAuth()
  const { customers } = useCustomers()

  const [orderMap, setOrderMap] = useState({})
  const listenerRefs            = useRef({})


  useEffect(() => {
    if (!user || !customers.length) {
      Object.values(listenerRefs.current).forEach(unsub => unsub())
      listenerRefs.current = {}
      setOrderMap({})
      return
    }

    const activeCustomerIds = new Set(customers.map(c => c.id))

    Object.keys(listenerRefs.current).forEach(id => {
      if (!activeCustomerIds.has(id)) {
        listenerRefs.current[id]()
        delete listenerRefs.current[id]
        setOrderMap(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    })

    customers.forEach(customer => {
      if (listenerRefs.current[customer.id]) return

      const unsub = subscribeToOrders(
        user.uid,
        customer.id,
        (orders) => {
          setOrderMap(prev => ({
            ...prev,
            [customer.id]: orders.map(order => ({
              ...order,
              customerName: order.customerName || customer.name,
              customerId:   customer.id,
            })),
          }))
        },
      )

      listenerRefs.current[customer.id] = unsub
    })

    return () => {
      Object.values(listenerRefs.current).forEach(unsub => unsub())
      listenerRefs.current = {}
    }
  }, [user, customers])


  const allOrders = Object.values(orderMap)
    .flat()
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0
      const bTime = b.createdAt?.toMillis?.() ?? 0
      return bTime - aTime
    })

  const getOrders = useCallback((customerId) => {
    return orderMap[customerId] || []
  }, [orderMap])


  const addOrder = useCallback(async (customerId, data) => {
    if (!user) return
    const { id: _localId, ...orderData } = data
    return await addOrderToDb(user.uid, customerId, orderData)
  }, [user])

  const updateOrder = useCallback(async (customerId, orderId, data) => {
    if (!user) return
    await updateOrderInDb(user.uid, customerId, String(orderId), data)
  }, [user])

  const updateOrderStatus = useCallback(async (customerId, orderId, status) => {
    if (!user) return
    await updateOrderStatusInDb(user.uid, customerId, String(orderId), status)
  }, [user])

  const updateOrderStage = useCallback(async (customerId, orderId, stage) => {
    if (!user) return
    await updateOrderStageInDb(user.uid, customerId, String(orderId), stage)
  }, [user])

  const deleteOrder = useCallback(async (customerId, orderId) => {
    if (!user) return
    await deleteOrderFromDb(user.uid, customerId, String(orderId))
  }, [user])

  return (
    <OrdersContext.Provider value={{
      allOrders,
      getOrders,
      addOrder,
      updateOrder,
      updateOrderStatus,
      updateOrderStage,
      deleteOrder,
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}