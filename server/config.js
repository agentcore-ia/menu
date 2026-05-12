export function getServerConfig() {
  return {
    port: Number(process.env.PORT ?? 8787),
    dataProvider: process.env.NEUROREST_DATA_PROVIDER ?? 'mock',
    supabaseUrl: process.env.NEUROREST_SUPABASE_URL ?? '',
    supabaseApiKey: process.env.NEUROREST_SUPABASE_API_KEY ?? '',
    supabaseWriteApiKey:
      process.env.NEUROREST_SUPABASE_WRITE_API_KEY ??
      process.env.NEUROREST_SUPABASE_STORAGE_API_KEY ??
      process.env.NEUROREST_SUPABASE_API_KEY ??
      '',
    supabaseStorageApiKey:
      process.env.NEUROREST_SUPABASE_STORAGE_API_KEY ??
      process.env.NEUROREST_SUPABASE_API_KEY ??
      '',
    adminToken: process.env.NEUROREST_ADMIN_TOKEN ?? '',
    storageBucket: process.env.NEUROREST_SUPABASE_STORAGE_BUCKET ?? 'menu-videos',
    databaseProvider: process.env.NEUROREST_DB_PROVIDER ?? 'postgres',
    databaseUrl: process.env.DATABASE_URL ?? '',
    mysqlHost: process.env.MYSQL_HOST ?? '',
    mysqlPort: Number(process.env.MYSQL_PORT ?? 3306),
    mysqlUser: process.env.MYSQL_USER ?? '',
    mysqlPassword: process.env.MYSQL_PASSWORD ?? '',
    mysqlDatabase: process.env.MYSQL_DATABASE ?? '',
    tableNames: {
      accounts: process.env.NEUROREST_ACCOUNTS_TABLE ?? 'accounts',
      categories: process.env.NEUROREST_CATEGORIES_TABLE ?? 'menu_categories',
      products: process.env.NEUROREST_PRODUCTS_TABLE ?? 'menu_products',
    },
  }
}
