import { mockMenus } from '../data/mockMenus.js'

export class MockMenuRepository {
  async getMenuByAccountId(accountId) {
    return mockMenus.find((menu) => menu.accountId === accountId) ?? null
  }
}
