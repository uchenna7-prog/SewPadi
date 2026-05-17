import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToTasks,
  addTask as addTaskToDb,
  updateTask as updateTaskInDb,
  toggleTask as toogleTaskInDb,
  deleteTask as deleteTaskFromDb,
} from '../services/taskService'

const TaskContext = createContext(null)

export function TaskProvider({ children }) {

  const { user } = useAuth()

  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

 
  useEffect(() => {

    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToTasks(
      user.uid,
      (data) => { 
        setTasks(data); 
        setLoading(false) 
      },
      (err)  => { 
        setError(err.message); 
        setLoading(false) 
      }
    )

    return unsubscribe
  }, [user])



  const addTask = useCallback(async (data) => {

    if (!user) return
    try {
      const { id: _localId, ...taskData } = data
      return await addTaskToDb(user.uid, taskData)
    } 
    catch (err) {
      setError(err.message)

    }
  }, [user])

  const updateTask = useCallback(async (id, data) => {

    if (!user) return
    try {
      await updateTaskInDb(user.uid, String(id), data)
    } 
    catch (err) {
      setError(err.message)
    }
  }, [user])


  const toggleTask = useCallback(async (id, currentDone) => {

    if (!user) return
    try {
      await toogleTaskInDb(user.uid, String(id), currentDone)
    } 
    catch (err) {
      setError(err.message)

    }
  }, [user])

  const deleteTask = useCallback(async (id) => {
    if (!user) return
    try {
      await deleteTaskFromDb(user.uid, String(id))
    } 
    catch (err) {
      setError(err.message)

    }
  }, [user])

  const getTask = useCallback((id) => {
    return tasks.find(task => String(task.id) === String(id)) ?? null
  }, [tasks])

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      error,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      getTask,
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  return ctx
}
