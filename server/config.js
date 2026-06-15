export function getServerConfig() {
  return {
    port: Number(process.env.PORT ?? 8787),
    dataProvider: process.env.CAPTA_DATA_PROVIDER ?? process.env.NEUROREST_DATA_PROVIDER ?? 'mock',
    supabaseUrl: process.env.CAPTA_SUPABASE_URL ?? process.env.NEUROREST_SUPABASE_URL ?? '',
    supabaseApiKey: process.env.CAPTA_SUPABASE_API_KEY ?? process.env.NEUROREST_SUPABASE_API_KEY ?? '',
    supabaseWriteApiKey:
      process.env.CAPTA_SUPABASE_WRITE_API_KEY ??
      process.env.CAPTA_SUPABASE_STORAGE_API_KEY ??
      process.env.CAPTA_SUPABASE_API_KEY ??
      process.env.NEUROREST_SUPABASE_WRITE_API_KEY ??
      process.env.NEUROREST_SUPABASE_STORAGE_API_KEY ??
      process.env.NEUROREST_SUPABASE_API_KEY ??
      '',
    supabaseStorageApiKey:
      process.env.CAPTA_SUPABASE_STORAGE_API_KEY ??
      process.env.CAPTA_SUPABASE_API_KEY ??
      process.env.NEUROREST_SUPABASE_STORAGE_API_KEY ??
      process.env.NEUROREST_SUPABASE_API_KEY ??
      '',
    adminToken: process.env.CAPTA_ADMIN_TOKEN ?? process.env.NEUROREST_ADMIN_TOKEN ?? '',
    storageBucket: process.env.CAPTA_SUPABASE_STORAGE_BUCKET ?? process.env.NEUROREST_SUPABASE_STORAGE_BUCKET ?? 'menu-videos',
    n8nWhatsappWebhookUrl:
      process.env.CAPTA_N8N_WHATSAPP_WEBHOOK_URL ||
      process.env.NEUROREST_N8N_WHATSAPP_WEBHOOK_URL ||
      'https://agentcore-n8n.8zp1cp.easypanel.host/webhook/menu-whatsapp-confirmation',
    n8nWebhookSecret: process.env.CAPTA_N8N_WEBHOOK_SECRET ?? process.env.NEUROREST_N8N_WEBHOOK_SECRET ?? '',
    dashboardUrl:
      process.env.CAPTA_DASHBOARD_URL ??
      process.env.NEUROREST_DASHBOARD_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'https://app.capta.ar',
    internalServiceKey:
      process.env.CAPTA_INTERNAL_SERVICE_KEY ??
      process.env.NEUROREST_INTERNAL_SERVICE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      '',
    databaseProvider: process.env.CAPTA_DB_PROVIDER ?? process.env.NEUROREST_DB_PROVIDER ?? 'postgres',
    databaseUrl: process.env.DATABASE_URL ?? '',
    mysqlHost: process.env.MYSQL_HOST ?? '',
    mysqlPort: Number(process.env.MYSQL_PORT ?? 3306),
    mysqlUser: process.env.MYSQL_USER ?? '',
    mysqlPassword: process.env.MYSQL_PASSWORD ?? '',
    mysqlDatabase: process.env.MYSQL_DATABASE ?? '',
    tableNames: {
      accounts: process.env.CAPTA_ACCOUNTS_TABLE ?? process.env.NEUROREST_ACCOUNTS_TABLE ?? 'accounts',
      categories: process.env.CAPTA_CATEGORIES_TABLE ?? process.env.NEUROREST_CATEGORIES_TABLE ?? 'menu_categories',
      products: process.env.CAPTA_PRODUCTS_TABLE ?? process.env.NEUROREST_PRODUCTS_TABLE ?? 'menu_products',
    },
  }
}
