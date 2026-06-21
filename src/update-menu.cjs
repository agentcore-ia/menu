const fs = require('fs');
let c = fs.readFileSync('MenuApp.jsx', 'utf8');

// 1. Rename isKikaTableOrder to isTableOrder globally
c = c.replace(/isKikaTableOrder/g, 'isTableOrder');

// 2. Modify the initialization of isTableOrder to include mesaId
c = c.replace(
  /const isTableOrder = templateId === 'kika' \|\| templateId === 'almendra'/g,
  "const isTableOrder = mesaId != null || templateId === 'kika' || templateId === 'almendra'"
);

// 3. Add mesaId to the payload
c = c.replace(
  /deliveryQuote: confirmedDeliveryQuote,/g,
  "deliveryQuote: confirmedDeliveryQuote,\n      mesa_id: mesaId,"
);

// 4. Add mesaId to the state (after orderForm initialization)
c = c.replace(
  /const \[orderForm, setOrderForm\] = useState\(\{[\s\S]*?\}\)/,
  `const [mesaId, setMesaId] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search)
      return search.get('mesa') || search.get('mesa_id') || null
    }
    return null
  })

  const [orderForm, setOrderForm] = useState(() => {
    let deliveryType = 'delivery'
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search)
      if (search.has('mesa') || search.has('mesa_id')) {
        deliveryType = 'local'
      }
    }
    return {
      name: '',
      phone: '',
      address: '',
      neighborhood: '',
      city: '',
      deliveryType,
      paymentMethod: 'cash',
      notes: '',
    }
  })`
);

fs.writeFileSync('MenuApp.jsx', c);
console.log('Update successful');
