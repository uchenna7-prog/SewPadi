export const INVOICE_STATUS_LABELS = {
  unpaid: 'Unpaid',
  part_paid: 'Part Payment',
  paid: 'Full Payment',
  overdue: 'Overdue',
}

export const INVOICE_STATUS_STYLES = {
  paid: { 
    background: 'rgba(34,197,94,0.12)',  
    color: '#15803d', 
    borderColor: 'rgba(34,197,94,0.3)'  
},
  part_paid: { 
    background: 'rgba(251,146,60,0.12)', 
    color: '#c2410c', 
    borderColor: 'rgba(251,146,60,0.3)' 
},
  unpaid: { 
    background: 'rgba(234,179,8,0.12)',  
    color: '#a16207', 
    borderColor: 'rgba(234,179,8,0.3)'  
},
  overdue: { 
    background: 'rgba(239,68,68,0.12)',  
    color: '#dc2626', 
    borderColor: 'rgba(239,68,68,0.3)'  
},
}

