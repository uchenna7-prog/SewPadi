import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider }                   from './contexts/AuthContext'
import { ProfileSettingsProvider }        from './contexts/ProfileSettingsContext'
import { GeneralSettingsProvider }        from './contexts/GeneralSettingsContext'
import { BrandProvider }                  from './contexts/BrandContext'
import { CustomerProvider }               from './contexts/CustomerContext'
import { OrdersProvider }                 from './contexts/OrdersContext'
import { TaskProvider }                   from './contexts/TaskContext'
import { InvoiceProvider }                from './contexts/InvoiceContext'
import { ReceiptProvider }                from './contexts/ReceiptContext'
import { PaymentProvider }                from './contexts/PaymentContext'
import { AppointmentProvider }            from './contexts/AppointmentContext'
import { NotificationProvider }           from './contexts/NotificationContext'
import { PremiumProvider }                from './contexts/PremiumContext'
import { GalleryProvider }                from './contexts/GalleryContext'
import { ReviewProvider }                 from './contexts/ReviewContext'
import { BodyMeasurementImagesProvider }  from './contexts/BodyMeasurementImagesContext'
import { AgentProvider }                  from './contexts/AgentContext'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GeneralSettingsProvider>
          <ProfileSettingsProvider>
            <BrandProvider>
              <PremiumProvider>
                <BodyMeasurementImagesProvider>
                  <CustomerProvider>
                    <GalleryProvider>
                      <ReviewProvider>
                        <OrdersProvider>
                          <TaskProvider>
                            <InvoiceProvider>
                              <ReceiptProvider>
                                <PaymentProvider>
                                  <AppointmentProvider>
                                    <AgentProvider>
                                      <NotificationProvider>
                                        <App />
                                      </NotificationProvider>
                                    </AgentProvider>
                                  </AppointmentProvider>
                                </PaymentProvider>
                              </ReceiptProvider>
                            </InvoiceProvider>
                          </TaskProvider>
                        </OrdersProvider>
                      </ReviewProvider>
                    </GalleryProvider>
                  </CustomerProvider>
                </BodyMeasurementImagesProvider>
              </PremiumProvider>
            </BrandProvider>
          </ProfileSettingsProvider>
        </GeneralSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
  onOfflineReady() {
    console.log('TailorFlow is ready for offline use')
  },
})