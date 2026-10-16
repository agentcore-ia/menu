import { SupabaseOrderRepository } from './supabaseOrderRepository.js'

export function createOrderRepository(config) {
  if (config.dataProvider === 'supabase') {
    return new SupabaseOrderRepository(config)
  }

  return {
    async createOrder() {
      throw new Error('Los pedidos solo estan habilitados con CAPTA_DATA_PROVIDER=supabase.')
    },
    // Sin base no hay puntos, pero la pantalla tiene que poder preguntar.
    async puntosDeCapta() {
      return null
    },
    async resumenDePuntos() {
      return null
    },
    async cuponesParaLaApp() {
      return { ofertas: [], billetera: [] }
    },
    async evaluarCuponDeCapta() {
      return { ok: false, motivo: 'Los cupones no están disponibles.' }
    },
  }
}
