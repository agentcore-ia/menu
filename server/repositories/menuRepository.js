import { MockMenuRepository } from './mockMenuRepository.js'
import { SqlMenuRepository } from './sqlMenuRepository.js'
import { SupabaseMenuRepository } from './supabaseMenuRepository.js'
import { enrichMenu } from '../presentation/enrichMenu.js'

export function createMenuRepository(config) {
  let repository

  if (config.dataProvider === 'supabase') {
    repository = new SupabaseMenuRepository(config)
  } else if (config.dataProvider === 'sql') {
    repository = new SqlMenuRepository(config)
  } else {
    repository = new MockMenuRepository()
  }

  return {
    async getMenuByAccountId(accountId) {
      const menu = await repository.getMenuByAccountId(accountId)
      return menu ? enrichMenu(menu) : null
    },
  }
}
