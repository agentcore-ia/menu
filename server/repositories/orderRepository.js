import { SupabaseOrderRepository } from './supabaseOrderRepository.js'

export function createOrderRepository(config) {
  if (config.dataProvider === 'supabase') {
    return new SupabaseOrderRepository(config)
  }

  return {
    async createOrder() {
      throw new Error('Los pedidos solo estan habilitados con CAPTA_DATA_PROVIDER=supabase.')
    },
  }
}
