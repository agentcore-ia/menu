import React, { useEffect, useState } from 'react';

export default function QRLanding({
  accountId,
  mesaId,
  restaurantName,
  logoUrl,
  welcomeText,
  onVerMenu,
  onPagarCuenta,
  onDejarCalificacion,
  primaryColor
}) {
  const [tableSession, setTableSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTableSession() {
      if (!mesaId) return;
      try {
        const response = await fetch(`/api/accounts/${accountId}/tables/${mesaId}/session`);
        if (response.ok) {
          const session = await response.json();
          setTableSession(session);
        }
      } catch (err) {
        console.error("Error loading table session", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTableSession();
  }, [accountId, mesaId]);

  return (
    <div className="qr-landing" style={{ backgroundColor: '#f8f9fa', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        
        {logoUrl && (
          <img src={logoUrl} alt={restaurantName} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '16px' }} />
        )}
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '4px' }}>
          {restaurantName || 'Bienvenidos'}
        </h1>
        <div style={{ display: 'inline-block', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '24px' }}>
          Mesa {decodeURIComponent(mesaId).toUpperCase().replace('MESA ', '').replace('MESA', '')}
        </div>

        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.5' }}>
          {welcomeText || '¿Qué te gustaría hacer?'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={onVerMenu}
            style={{ 
              backgroundColor: primaryColor || '#000', 
              color: 'white', 
              border: 'none', 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '16px', 
              fontWeight: '600', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.1s'
            }}
          >
            Ver el menú
          </button>
          
          <button 
            onClick={onPagarCuenta}
            style={{ 
              backgroundColor: 'white', 
              color: primaryColor || '#000', 
              border: `2px solid ${primaryColor || '#000'}`, 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '16px', 
              fontWeight: '600', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Pagar cuenta
          </button>

          <button 
            onClick={onDejarCalificacion}
            style={{ 
              backgroundColor: 'transparent', 
              color: '#6b7280', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '12px', 
              fontSize: '15px', 
              fontWeight: '500', 
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Dejar calificación
          </button>
        </div>
      </div>
    </div>
  );
}
