import React, { useState } from 'react';

export default function QRFeedback({
  accountId,
  mesaId,
  restaurantName,
  primaryColor,
  onClose
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Por favor selecciona una calificación");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/tables/${mesaId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      if (response.ok) {
        setIsDone(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100dvh', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', textAlign: 'center', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>¡Gracias por tu visita!</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Tus comentarios nos ayudan a mejorar.</p>
          <button 
            onClick={onClose}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: primaryColor || '#000', color: 'white', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100dvh', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '8px 0', marginBottom: '16px', alignSelf: 'flex-start' }}
      >
        ←
      </button>

      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>¿Qué tal estuvo todo?</h2>
        <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '14px', marginBottom: '24px' }}>En {restaurantName}</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '32px', 
                  cursor: 'pointer',
                  color: rating >= star ? '#fbbf24' : '#e5e7eb',
                  transition: 'color 0.2s'
                }}
              >
                ★
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="¿Qué te gustó más? ¿Qué podríamos mejorar?"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !rating}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: rating ? (primaryColor || '#000') : '#e5e7eb',
              color: rating ? 'white' : '#9ca3af',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: rating ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </form>
      </div>
    </div>
  );
}
