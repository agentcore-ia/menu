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
  
  // 'bill' | 'tip'
  const [step, setStep] = useState('bill');
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTipIndex, setSelectedTipIndex] = useState(null); // 0, 1, 2, 'other', 'none'

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

  const handlePay = async (method) => {
    setIsPaying(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/tables/${mesaId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: (session?.pending_amount || 0) + tipAmount,
          payment_method: method
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
  
  const tableNumber = decodeURIComponent(mesaId || '').replace(/mesa\s*/i, '');
  const allItems = orders.flatMap(order => order.items_pedido || []);

  const fixedTips = [2000, 3500, 5000];

  const handleSelectFixedTip = (index, amount) => {
    setSelectedTipIndex(index);
    setTipAmount(amount);
  };

  const handleSelectNoTip = () => {
    setSelectedTipIndex('none');
    setTipAmount(0);
  };

  const handleSelectOtherTip = () => {
    setSelectedTipIndex('other');
    const amount = prompt("Ingresa el monto de propina:");
    if (amount !== null && !isNaN(Number(amount))) {
      setTipAmount(Number(amount));
    } else {
      handleSelectNoTip();
    }
  };

  const totalWithTip = subtotal + tipAmount;

  if (step === 'tip') {
    return (
      <div style={{ backgroundColor: '#f4f4f5', minHeight: '100dvh', paddingBottom: '220px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => setStep('bill')}
            style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#000', padding: 0 }}
          >
            ←
          </button>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#000', margin: '8px 24px 32px 24px', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
          ¿Cuánto te gustaría dejar de propina?
        </h1>

        <div style={{ padding: '0 24px' }}>
          {/* Top row with fixed tips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {fixedTips.map((amount, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectFixedTip(idx, amount)}
                style={{
                  backgroundColor: selectedTipIndex === idx ? '#6c5ce7' : 'white',
                  color: selectedTipIndex === idx ? 'white' : '#1c1c1e',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '20px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Bottom row with Other and None */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={handleSelectOtherTip}
              style={{
                backgroundColor: selectedTipIndex === 'other' ? '#6c5ce7' : 'white',
                color: selectedTipIndex === 'other' ? 'white' : '#1c1c1e',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 0',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
              Otro monto
            </button>
            <button
              onClick={handleSelectNoTip}
              style={{
                backgroundColor: selectedTipIndex === 'none' ? '#6c5ce7' : 'white',
                color: selectedTipIndex === 'none' ? 'white' : '#1c1c1e',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 0',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
              No propina
            </button>
          </div>
        </div>

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f4f4f5',
          padding: '24px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          zIndex: 100
        }}>
          <div style={{ textAlign: 'center', color: '#8e8e93', fontSize: '12px', marginBottom: '24px' }}>
            Al continuar, aceptas los <strong>Términos de Servicio</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#8e8e93', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
            </span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#000' }}>
              ${totalWithTip}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              disabled={isPaying}
              onClick={() => handlePay('mercadopago')}
              style={{
                width: '100%',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Mercado Pago
            </button>
            <button
              disabled={isPaying}
              onClick={() => handlePay('applepay')}
              style={{
                width: '100%',
                backgroundColor: '#111827',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
               Pay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // default 'bill' view
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
            disabled={subtotal === 0}
            onClick={() => setStep('tip')}
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
            Pagar la cuenta
          </button>
        )}
      </div>
    </div>
  );
}
