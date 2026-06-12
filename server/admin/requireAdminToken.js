export function assertAdminToken(config, req) {
  if (!config.adminToken) {
    throw new Error('CAPTA_ADMIN_TOKEN no esta configurado.')
  }

  const providedToken =
    req.headers['x-admin-token'] ||
    req.headers['X-Admin-Token'] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '')

  if (providedToken !== config.adminToken) {
    const error = new Error('UNAUTHORIZED')
    error.code = 'UNAUTHORIZED'
    throw error
  }
}
