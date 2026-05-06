


export const RECEIPT_SAMPLE_DATA = {
  number: 'RCP-0001',
  date: '12 Apr 2025',
  orderDesc: 'Complete Suit Set',
  price: '60000',


    items: [
    { name: 'Suit Jacket', price: '25000' },
    { name: 'Trousers', price: '15000' },
    { name: 'Inner Shirt', price: '8000' },
    { name: 'Waistcoat', price: '12000' },
  ],

  payments: [
    { date: '10 Apr 2025', amount: '30000', method: 'transfer' },
    { date: '12 Apr 2025', amount: '35000', method: 'cash' },
  ],
  cumulativePaid: '65000',
  shippingFee:6000,
  discountType:"flat",
  discountAmount:1000
}



export const getBrandSampleData = (brand) => {
  return {
    name: 'Emeka Tailors',
    ownerName: 'Emeka Nwosu',
    tagline: 'Crafted with love, fitted for you',
    address: '14 Bode Thomas St, Surulere, Lagos',
    phone: '+234 801 234 5678',
    email: 'info@emekatailors.ng',
    website: 'emekatailors.ng',
    currency: brand.invoiceCurrency || '₦',
    invoiceFooter: 'Thank you for your patronage🙏',
    showTax: false,
    taxRate: 0,
    dueDays: 14,
    accountBank: 'GTBank',
    accountNumber: '0123456789',
    accountName: 'Emeka Nwosu',
    colour: brand?.colour || '#1C1814',
    colourId: brand?.colourId || 'bold-electric-blue',
    receiptFooter: 'Thank you for your patronage🙏',


  };
}; 

 export const CUSTOMER_SAMPLE_DATA = {
  name: 'Mr. Uche Okafor',
  phone: '+234 801 234 5678',
  address: '22 Akin Adesola St, Victoria Island',
  email:"ucheokafor@gmail.com"
}

export const INVOICE_SAMPLE_DATA = {
  number: 'INV-0001',
  date: '12 Apr 2025',
  dueDate: '26 Apr 2025',
  orderDesc: 'Complete Suit Set',
  price: '60000',
    items: [
    { name: 'Suit Jacket', price: '25000' },
    { name: 'Trousers', price: '15000' },
    { name: 'Inner Shirt', price: '8000' },
    { name: 'Waistcoat', price: '12000' },
  ],
  shippingFee:6000,
  discountType:"flat",
  discountAmount:1000

}