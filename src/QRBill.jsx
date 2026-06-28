import React, { useEffect, useState } from 'react';

export default function QRBill({
  accountId,
  mesaId,
  restaurantName,
  logoUrl,
  primaryColor,
  onBack,
  onFeedback
}) {
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionRes, ordersRes] = await Promise.all([
          fetch(`/api/accounts/${accountId}/tables/${mesaId}/session`),
          fetch(`/api/accounts/${accountId}/tables/${mesaId}/orders`)
        ]);
        
        if (sessionRes.ok) setSession(await sessionRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
      } catch (err) {
        console.error("Error loading bill", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [accountId, mesaId]);

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/tables/${mesaId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: session?.pending_amount || 0,
          payment_method: 'mercadopago_mock'
        })
      });
      if (response.ok) {
        onFeedback();
      } else {
        alert("Hubo un error al procesar el pago");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando cuenta...</div>;
  }

  const subtotal = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const isPaid = session?.status === 'paid' || session?.status === 'closed';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100dvh', padding: '24px' }}>
      <button 
        onClick={onBack}
        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '8px 0', marginBottom: '16px' }}
      >
        ←
      </button>

      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {logoUrl && <img src={logoUrl} alt={restaurantName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />}
          <h2 style={{ fontSize: '20px', margin: '8px 0 4px 0' }}>{restaurantName}</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Mesa {decodeURIComponent(mesaId).replace(/mesa /i, '')}</p>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Tu Consumo</h3>
        
        {orders.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay pedidos registrados en esta mesa.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {orders.map((order, index) => (
              <li key={index} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px' }}>Pedido #{order.orderNumber || order.id.slice(0,6)}</strong>
                  <span style={{ fontWeight: '600' }}>${order.total}</span>
                </div>
                {order.items_pedido && order.items_pedido.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>${item.price * item.quantity}</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: '500' }}>Total a pagar</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: primaryColor || '#000' }}>
            ${subtotal}
          </span>
        </div>

        {isPaid ? (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '12px', textAlign: 'center', fontWeight: '600' }}>
            ¡Cuenta pagada!
            <button onClick={onFeedback} style={{ display: 'block', width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid currentColor', borderRadius: '8px', padding: '8px', color: 'inherit', cursor: 'pointer' }}>
              Dejar sugerencia
            </button>
          </div>
        ) : (
          <button
            disabled={isPaying || subtotal === 0}
            onClick={handlePay}
            style={{
              width: '100%',
              marginTop: '24px',
              backgroundColor: subtotal > 0 ? (primaryColor || '#000') : '#e5e7eb',
              color: subtotal > 0 ? 'white' : '#9ca3af',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: subtotal > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {isPaying ? 'Procesando...' : 'Ir a Pagar'}
          </button>
        )}
      </div>
    </div>
  );
}
