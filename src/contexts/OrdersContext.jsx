import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useAuth } from './AuthContext'
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
  const [allOrders, setAllOrders] = useState([])

  useEffect(() => {
    if (!user) {
      setAllOrders([])
      return
    }
    return subscribeToOrders(user.uid, setAllOrders)
  }, [user])

  const addOrder = useCallback(async (customerId, data) => {
    if (!user) return
    const { id: _, ...orderData } = data
    return addOrderToDb(user.uid, customerId, orderData)
  }, [user])

  const updateOrder = useCallback(async (customerId, orderId, data) => {
    if (!user) return
    return updateOrderInDb(user.uid, orderId, data)
  }, [user])

  const updateOrderStatus = useCallback(async (customerId, orderId, status) => {
    if (!user) return
    return updateOrderStatusInDb(user.uid, orderId, status)
  }, [user])

  const updateOrderStage = useCallback(async (customerId, orderId, stage) => {
    if (!user) return
    return updateOrderStageInDb(user.uid, orderId, stage)
  }, [user])

  const deleteOrder = useCallback(async (customerId, orderId) => {
    if (!user) return
    return deleteOrderFromDb(user.uid, orderId)
  }, [user])

  return (
    <OrdersContext.Provider value={{
      allOrders,
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