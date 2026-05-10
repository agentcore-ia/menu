import { MockMenuRepository } from './mockMenuRepository.js'
import { SqlMenuRepository } from './sqlMenuRepository.js'

export function createMenuRepository(config) {
  if (config.dataProvider === 'sql') {
    return new SqlMenuRepository(config)
  }

  return new MockMenuRepository()
}
