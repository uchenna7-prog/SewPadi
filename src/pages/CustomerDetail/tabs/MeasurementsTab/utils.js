
export function groupMeasurementsByDate(measurements) {
  
  return measurements.reduce((groups, measurement) => {
    const dateKey = measurement.date || 'Unknown Date'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(measurement)
    return groups
  }, {})
}


export function createBlankCard(cardNumber) {
  return {
    id:      Date.now() + Math.random(),
    label:   `Cloth Type ${cardNumber}`,
    name:    '',
    imgSrcs: [],   // will hold Cloudinary URLs after upload
    fields:  [{ id: Date.now() + Math.random(), name: '', value: '' }],
  }
}