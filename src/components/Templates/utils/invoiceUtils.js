
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export function calcTax(subtotal, taxRate, showTax) {

  if (!showTax || !taxRate){
    return 0
  }   
  return subtotal * (taxRate / 100)
}

export function getDueDate(invoice, dueDays) {
  
  if (invoice.due) {
    return invoice.due
  }

  try {
    const date = new Date(invoice.date)
    date.setDate(date.getDate() + (dueDays || 7))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } 
  catch { 
    return '—' 
  }
}


export function sanitizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\D/g, '').replace(/^0/, '')
}


