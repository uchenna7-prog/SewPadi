
export function calcTax(subtotal, taxRate, showTax) {
  
  if (!showTax || !taxRate) return 0
  return subtotal * (taxRate / 100)
}
