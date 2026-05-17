export const getReceiptSampleData = (receiptBrandSettings)=>{

  return{

      paymentId: "",
      orderId: "",
      orderDesc: 'Complete Suit Set',
      orderPrice: '116000',
      items: [
        { 
          name: 'Suit Jacket', 
          price: '25000',
          qty: 2
        },
        { 
          name: 'Trousers', 
          price: '15000',
          qty: 2 
        },
        { 
          name: 'Inner Shirt', 
          price: '8000',
          qty: 3
        },
        { 
          name: 'Waistcoat', 
          price: '12000',
          qty: 1 
        },
      ],
      number: `${receiptBrandSettings.prefix}-0001` || "RCP-0001",
      date: '12 Apr 2025',
      template: receiptBrandSettings.template || "receiptTemplate1",
      currentInstallmentId: null,
      installmentIds: null,
      payments: [

        { 
          id:"1",
          amount: '31000', 
          method: 'transfer', 
          date: '12 Apr 2025', 
          time: new Date(2025,5,12,17,45).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        
        }

    ],
      previousInstallments: [
        { 
          id:"0",
          amount: '90000',
          method: 'cash',  
          date: '10 Apr 2025',
          time: new Date(2025,5,10,10,30).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
   
        }
      ],
      previousPaid: 0,
      cumulativePaid: '121000',
      isFullPayment: true,
      balance : 0,
      notes: '',
      shippingFee: 6000,
      discountType: "flat",
      discountValue: 0,
      discountAmount: 1000,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 121000,
      brandSnapshot: receiptBrandSettings

  }
}

 export const CUSTOMER_SAMPLE_DATA = {
  name: 'Mr. Uche Okafor',
  phone: '+234 801 234 5678',
  address: '22 Akin Adesola St, Victoria Island',
  email:"ucheokafor@gmail.com"
}


export const getInvoiceSampleData = (invoiceBrandSettings)=>{

  return{
      id: "",
      orderId: "",
      number: `${invoiceBrandSettings.prefix}-0001` || "INV-0001",
      date: '12 Apr 2025',
      status: 'unpaid',
      template: invoiceBrandSettings.template || "invoiceTemplate1",
      orderDesc: 'Complete Suit Set',
      price: '116000',
      qty: 8,
      items: [
        { 
          name: 'Suit Jacket', 
          price: '25000',
          qty: 2
        },
        { 
          name: 'Trousers', 
          price: '15000',
          qty: 2
        },
        { 
          name: 'Inner Shirt', 
          price: '8000',
          qty: 3
        },
        { 
          name: 'Waistcoat', 
          price: '12000',
          qty: 1
        },
      ],
      linkedNames: [],
      due: '26 Apr 2025' ,
      notes: "",
      shippingFee: 6000,
      discountType: "flat",
      discountValue: 0,
      discountAmount: 1000,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 121000,
      brandSnapshot : invoiceBrandSettings
 
  }

}
