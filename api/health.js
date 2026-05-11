import { getServerConfig } from '../server/config.js'

export default async function handler(_req, res) {
  const config = getServerConfig()

  res.status(200).json({
    ok: true,
    provider: config.dataProvider,
  })
}
