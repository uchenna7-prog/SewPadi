export function formatMoney(
  currency, 
  amount,
  minimumFractionDigits = 2, 
  maximumFractionDigits = 2
) {

  const number = parseFloat(amount) || 0
  return `${currency}${number.toLocaleString('en-NG', { minimumFractionDigits: minimumFractionDigits, maximumFractionDigits:  maximumFractionDigits })}`
  
}


export function getCurrency() {
  try {
    const settings = JSON.parse(localStorage.getItem('sewpadi_general_settings') || '{}')
    return settings.invoiceCurrency || '₦'
  } 
  catch {
    return '₦'
  }
}
