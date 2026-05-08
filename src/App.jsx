import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth/RequireAuth'
import SideBar from './components/SideBar/SideBar'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import Home from './pages/Home/Home'
import Customers from './pages/Customers/Customers'
import CustomerDetail from './pages/CustomerDetail/CustomerDetail'
import CustomerBodyMeasurements from './pages/CustomerBodyMeasurements/CustomerBodyMeasurements'
import Tasks from './pages/Tasks/Tasks'
import Orders from './pages/Orders/Orders'
import Invoices from './pages/Invoices/Invoices'
import Receipts from './pages/Receipts/Receipts'
import Gallery from './pages/Gallery/Gallery'
import Settings from './pages/Settings/Settings'
import Profile from './pages/Profile/Profile'
import Contact from './pages/Contact/Contact'
import FAQ from './pages/FAQ/FAQ'
import Appointments from './pages/Appointments/Appointments'
import AllPayments from './pages/AllPayments/AllPayments'
import Inventory from './pages/Inventory/Inventory'
import Reports from './pages/Reports/Reports'
import Portfolio from './pages/Portfolio/Portfolio'
import ReviewPage from './pages/ReviewPage/ReviewPage'
import Reviews from './pages/Reviews/Reviews'
import Agent from './pages/Agent/Agent'
import './index.css'


function AppShell() {

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuClick = () => setSidebarOpen(true)
  const navigate  = useNavigate()

  return (
    <div className="appShell">

      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="appContent">

        <Routes>

          <Route path="/" element={<Home onMenuClick={menuClick} />} />
          <Route path="/appointments" element={<Appointments onMenuClick={menuClick} />} />
          <Route path="/customers" element={<Customers onMenuClick={menuClick} />} />
          <Route path="/customers/:id" element={<CustomerDetail onMenuClick={menuClick} />} />
          <Route path="/customers/:id/body-measurements" element={<CustomerBodyMeasurements onMenuClick={menuClick} />} />
          <Route path="/tasks" element={<Tasks onMenuClick={menuClick} />} />
          <Route path="/orders" element={<Orders onMenuClick={menuClick} onGoToCustomer={id => navigate(`/customers/${id}`)} />} />
          <Route path="/invoices" element={<Invoices onMenuClick={menuClick} />} />
          
          <Route path="/receipts" element={<Receipts onMenuClick={menuClick} />} />
          <Route path="/payments" element={<AllPayments onMenuClick={menuClick} />} />
          <Route path="/inventory" element={<Inventory onMenuClick={menuClick} />} />
          <Route path="/reports" element={<Reports onMenuClick={menuClick} />} />
          <Route path="/gallery" element={<Gallery onMenuClick={menuClick} />} />
          <Route path="/settings" element={<Settings onMenuClick={menuClick} />} />
          <Route path="/profile" element={<Profile onMenuClick={menuClick} />} />
          <Route path="/contact" element={<Contact onMenuClick={menuClick} />} />
          <Route path="/faq" element={<FAQ onMenuClick={menuClick} />} />
          <Route path="/reviews" element={<Reviews onMenuClick={menuClick} />} />
          <Route path="/agent" element={<Agent onMenuClick={menuClick} />} />
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </div>

    </div>
  )
}

export default function App() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portfolio/:handle"   element={<Portfolio />} />
      <Route path="/review/:uid/:token"  element={<ReviewPage />} />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />

    </Routes>
  )
}