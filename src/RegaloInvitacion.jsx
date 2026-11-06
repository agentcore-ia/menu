// El popup que aparece cuando una cuenta nueva termina de registrarse por un link de invitacion (o QR):
// le cuenta el premio que obtuvo y como usarlo. El premio ya esta guardado en su cuenta.

export function RegaloInvitacion({ regalo, onCerrar, onUsar }) {
  if (!regalo) return null
  const varios = regalo.premios.length > 1
  return (
    <div className="cd-regalo-fondo" role="dialog" aria-modal="true" aria-label="Tu premio" onClick={onCerrar}>
      <div className="cd-regalo-caja" onClick={(e) => e.stopPropagation()}>
        <span className="cd-regalo-emoji" aria-hidden="true">
          🎁
        </span>
        <h2>{regalo.aleatorio ? '¡Te tocó un premio!' : '¡Bienvenido a Capta Delivery!'}</h2>
        <p className="cd-regalo-intro">
          {regalo.aleatorio
            ? 'Esto es lo que ganaste:'
            : varios
              ? 'Te regalamos estos beneficios por sumarte:'
              : 'Te regalamos este beneficio por sumarte:'}
        </p>

        <ul className="cd-regalo-lista">
          {regalo.premios.map((premio) => (
            <li key={premio.codigo}>
              <strong>{premio.texto}</strong>
              <span className="cd-regalo-titulo">{premio.titulo}</span>
              {premio.detalle ? <small>{premio.detalle}</small> : null}
            </li>
          ))}
        </ul>

        <p className="cd-regalo-guardado">
          Ya está guardado en tu cuenta{regalo.diasValidez ? ` y lo podés usar durante ${regalo.diasValidez} días` : ''}. Lo usás
          al hacer tu pedido.
        </p>

        <button type="button" className="cd-regalo-boton" onClick={onUsar || onCerrar}>
          Empezar a pedir
        </button>
        <button type="button" className="cd-regalo-cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
