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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f5' }}>Cargando cuenta...</div>;
  }

  const subtotal = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const isPaid = session?.status === 'paid' || session?.status === 'closed';
  
  // Clean up mesaId for display
  const tableNumber = decodeURIComponent(mesaId).replace(/mesa\s*/i, '');
  
  // Flatten all items from all orders
  const allItems = orders.flatMap(order => order.items_pedido || []);

  return (
    <div style={{ backgroundColor: '#f4f4f5', minHeight: '100dvh', paddingBottom: '160px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        .scallop-card {
          background-color: white;
          border-radius: 24px 24px 0 0;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          margin: 0 16px;
        }
        .scallop-card::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 10px;
          background-image: radial-gradient(circle at 10px 0, white 10px, transparent 11px);
          background-size: 20px 10px;
          background-repeat: repeat-x;
        }
      `}</style>
      
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#000', padding: 0 }}
        >
          ←
        </button>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#000', margin: '8px 24px 24px 24px', letterSpacing: '-0.5px' }}>
        Mesa Nº{tableNumber}
      </h1>

      <div className="scallop-card">
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '8px', fontWeight: '500' }}>
            Mesa Nº{tableNumber}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#000' }}>Total a pagar</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#000' }}>${subtotal}</span>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '0 0 20px 0' }} />

          {allItems.length === 0 ? (
            <p style={{ color: '#8e8e93', textAlign: 'center', fontSize: '15px' }}>No hay pedidos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {allItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#1c1c1e', fontWeight: '500' }}>
                  <span>{item.quantity} x {item.name}</span>
                  <span style={{ fontWeight: '700' }}>${item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#8e8e93', fontSize: '12px' }}>
        Al continuar, aceptas los <strong>Términos de Servicio</strong>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '24px',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.04)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        zIndex: 100
      }}>
        <div style={{ textAlign: 'center', color: '#8e8e93', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
          Para dividir la cuenta, por favor avisa al camarero
        </div>
        {isPaid ? (
          <button
            onClick={onFeedback}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Cuenta pagada - Dejar sugerencia
          </button>
        ) : (
          <button
            disabled={isPaying || subtotal === 0}
            onClick={handlePay}
            style={{
              width: '100%',
              backgroundColor: subtotal > 0 ? '#6c5ce7' : '#e5e7eb',
              color: subtotal > 0 ? 'white' : '#9ca3af',
              border: 'none',
              padding: '18px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: subtotal > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            {isPaying ? 'Procesando...' : 'Pagar la cuenta'}
          </button>
        )}
      </div>
    </div>
  );
}
