import React, { useEffect, useState } from 'react';

export default function QRLanding({
  accountId,
  mesaId,
  restaurantName,
  logoUrl,
  welcomeText,
  qrBackgroundUrl,
  reviewGoogleUrl,
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

  const handleDejarResena = () => {
    if (reviewGoogleUrl) {
      window.open(reviewGoogleUrl, '_blank', 'noopener,noreferrer');
    } else {
      onDejarCalificacion();
    }
  };

  const tableNumber = decodeURIComponent(mesaId || '').replace(/mesa\s*/i, '');

  return (
    <div style={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: qrBackgroundUrl ? '#000' : '#f4f4f5'
    }}>
      {qrBackgroundUrl && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${qrBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.65,
          zIndex: 0
        }} />
      )}

      <div style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '24px',
        width: 'calc(100% - 48px)',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        
        <div style={{ padding: '36px 24px 24px 24px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt={restaurantName} 
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '16px', border: '1px solid #eee' }} 
            />
          )}
          
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#000', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {restaurantName || 'Bienvenidos'}
          </h1>
          <div style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '400' }}>
            Mesa Nº{tableNumber}
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div onClick={onVerMenu} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu_book</span>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1c1c1e', marginBottom: '2px' }}>Ver el menú</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>Toca para ver el menú</div>
            </div>
          </div>

          <div onClick={onPagarCuenta} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>credit_card</span>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1c1c1e', marginBottom: '2px' }}>Pagar la cuenta</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>Revisa y paga tu cuenta sin contacto</div>
            </div>
          </div>

          <div onClick={handleDejarResena} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c5ce7', backgroundColor: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>edit</span>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1c1c1e', marginBottom: '2px' }}>Dejar reseña</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>Cuéntanos cómo fue tu experiencia</div>
            </div>
          </div>

        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '0',
        width: '100%',
        textAlign: 'center',
        zIndex: 10,
        color: qrBackgroundUrl ? 'rgba(255,255,255,0.8)' : '#8e8e93',
        fontSize: '12px',
        fontWeight: '500',
        paddingTop: '16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        backgroundColor: qrBackgroundUrl ? 'rgba(0,0,0,0.4)' : '#f4f4f5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          Conectado con <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ef4444' }}>favorite</span> capta
        </div>
      </div>
    </div>
  );
}
