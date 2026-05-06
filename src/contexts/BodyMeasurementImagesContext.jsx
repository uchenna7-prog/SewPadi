import { createContext, useContext } from 'react'
import { MALE_BODY_MEASUREMENTS } from './datas/maleBodyMeasurementDatas'
import { FEMALE_BODY_MEASUREMENTS } from './datas/femaleBodyMeasurementDatas'
import { MALE_BODY_MEASUREMENT_IMAGES } from './datas/maleBodyMeasurementDatas'
import { FEMALE_BODY_MEASUREMENT_IMAGES } from './datas/femaleBodyMeasurementDatas'

export function getBodyMeasurementConfig(sex) {
  if (sex === 'Female') {
    return { 
      fields: FEMALE_BODY_MEASUREMENTS, 
      imgMap: FEMALE_BODY_MEASUREMENT_IMAGES 
    }
  }
  return { 
    fields: MALE_BODY_MEASUREMENTS, 
    imgMap: MALE_BODY_MEASUREMENT_IMAGES 
  }
}


const BodyMeasurementImagesContext = createContext(null)

export function BodyMeasurementImagesProvider({ children }) {

  const value = {
    MALE_BODY_MEASUREMENTS,
    FEMALE_BODY_MEASUREMENTS,
    MALE_BODY_MEASUREMENT_IMAGES,
    FEMALE_BODY_MEASUREMENT_IMAGES,
    getBodyMeasurementConfig,
  }

  return (
    <BodyMeasurementImagesContext.Provider value={value}>
      {children}
    </BodyMeasurementImagesContext.Provider>
  )
}

export function useBodyMeasurementImages() {
  const ctx = useContext(BodyMeasurementImagesContext)
  if (!ctx) throw new Error('useBodyMeasurementImages must be used inside <BodyMeasurementImagesProvider>')
  return ctx
}