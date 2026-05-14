import mysql from 'mysql2/promise'
import pg from 'pg'

const { Pool } = pg

export class SqlMenuRepository {
  constructor(config) {
    this.config = config
    this.pool = null
  }

  async getMenuByAccountId(accountId) {
    const account = await this.fetchAccount(accountId)

    if (!account) {
      return null
    }

    const [categories, products] = await Promise.all([
      this.fetchCategories(account.id),
      this.fetchProducts(account.id),
    ])

    return {
      accountId: account.slug,
      accountName: account.name,
      currency: account.currency ?? 'USD',
      locale: account.locale ?? 'es',
      categories: categories.map((category) => ({
        id: category.slug,
        label: category.name,
        items: products
          .filter((product) => product.category_id === category.id)
          .map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description ?? '',
            unitPrice: Number(product.price ?? 0),
            price: product.price_display ?? `$${product.price ?? ''}`,
            image: product.image_url ?? '/dishes/hero-steak.jpg',
            hasCustomImage: Boolean(product.image_url),
            video: product.video_url ?? null,
            badge: product.badge ?? '',
            dietary: product.dietary_tags
              ? product.dietary_tags.split(',').map((tag) => tag.trim()).filter(Boolean)
              : [],
          })),
      })),
    }
  }

  async fetchAccount(accountId) {
    const table = this.config.tableNames.accounts
    const rows = await this.query(
      `select id, slug, name, currency, locale from ${table} where slug = ? limit 1`,
      [accountId],
    )

    return rows[0] ?? null
  }

  async fetchCategories(accountDbId) {
    const table = this.config.tableNames.categories
    return this.query(
      `select id, slug, name, sort_order from ${table} where account_id = ? order by sort_order asc, id asc`,
      [accountDbId],
    )
  }

  async fetchProducts(accountDbId) {
    const table = this.config.tableNames.products
    return this.query(
      `select
        id,
        category_id,
        name,
        description,
        price,
        price_display,
        image_url,
        video_url,
        badge,
        dietary_tags
      from ${table}
      where account_id = ? and is_active = 1
      order by sort_order asc, id asc`,
      [accountDbId],
    )
  }

  async query(sql, params) {
    if (this.config.databaseProvider === 'mysql') {
      const pool = this.getMysqlPool()
      const [rows] = await pool.execute(sql, params)
      return rows
    }

    const pool = this.getPostgresPool()
    let index = 0
    const pgSql = sql.replace(/\?/g, () => {
      index += 1
      return `$${index}`
    })
    const result = await pool.query(pgSql, params)
    return result.rows
  }

  getMysqlPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.config.mysqlHost,
        port: this.config.mysqlPort,
        user: this.config.mysqlUser,
        password: this.config.mysqlPassword,
        database: this.config.mysqlDatabase,
      })
    }

    return this.pool
  }

  getPostgresPool() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl,
      })
    }

    return this.pool
  }
}
