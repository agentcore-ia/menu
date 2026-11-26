// La rueda de la ruleta de bienvenida: la cuenta de hasta donde girar.
//
// El gajo lo elige el servidor; aca solo se calcula el angulo para que la flecha (arriba) quede
// sobre ese gajo. El gajo i ocupa de i*paso a (i+1)*paso, en el sentido del reloj desde arriba.

export const VUELTAS = 5

/** Grados totales a girar. `azar` (0 a 1) corre el punto dentro del gajo, sin llegar a los bordes. */
export function anguloParaGajo(indice, cantidad, azar = 0.5) {
  const paso = 360 / cantidad
  const corrimiento = (Math.min(Math.max(azar, 0), 1) - 0.5) * paso * 0.7
  const punto = (indice + 0.5) * paso + corrimiento
  return VUELTAS * 360 + (360 - punto)
}

/** Que gajo queda bajo la flecha despues de girar `grados`. */
export function gajoBajoLaFlecha(grados, cantidad) {
  const punto = ((360 - (grados % 360)) % 360 + 360) % 360
  return Math.floor(punto / (360 / cantidad))
}
