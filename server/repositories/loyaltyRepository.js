import { SupabaseLoyaltyRepository } from './supabaseLoyaltyRepository.js'

export function createLoyaltyRepository(config) {
  if (config.dataProvider === 'supabase') {
    return new SupabaseLoyaltyRepository(config)
  }

  return {
    async getLoyaltyByAccountId() {
      throw new Error('El programa de puntos solo esta habilitado con CAPTA_DATA_PROVIDER=supabase.')
    },
    async joinCommunityByAccountId() {
      throw new Error('El programa de puntos solo esta habilitado con CAPTA_DATA_PROVIDER=supabase.')
    },
  }
}
