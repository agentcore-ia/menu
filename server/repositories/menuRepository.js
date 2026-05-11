import { MockMenuRepository } from './mockMenuRepository.js'
import { SqlMenuRepository } from './sqlMenuRepository.js'
import { SupabaseMenuRepository } from './supabaseMenuRepository.js'

export function createMenuRepository(config) {
  if (config.dataProvider === 'supabase') {
    return new SupabaseMenuRepository(config)
  }

  if (config.dataProvider === 'sql') {
    return new SqlMenuRepository(config)
  }

  return new MockMenuRepository()
}
