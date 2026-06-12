import { SupabaseAdminRepository } from './supabaseAdminRepository.js'

export function createAdminRepository(config) {
  if (config.dataProvider !== 'supabase') {
    throw new Error('El panel admin requiere CAPTA_DATA_PROVIDER=supabase.')
  }

  return new SupabaseAdminRepository(config)
}
