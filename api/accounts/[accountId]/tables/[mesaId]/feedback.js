import { getServerConfig } from '../../../../../server/config.js'

async function resolveMesaId(config, restaurantId, mesaIdParam) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mesaIdParam)) {
    return mesaIdParam;
  }
  const decodedName = decodeURIComponent(mesaIdParam).toLowerCase().trim();
  const res = await fetch(`${config.supabaseUrl}/rest/v1/mesas?restaurant_id=eq.${restaurantId}&select=id,name`, {
    headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
  });
  const tables = await res.json();
  const matched = (tables || []).find(t => 
    t.name?.toLowerCase().trim() === decodedName ||
    t.name?.toLowerCase().trim() === `mesa ${decodedName}` ||
    t.name?.toLowerCase().trim() === `mesa${decodedName}`
  );
  return matched ? matched.id : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const config = getServerConfig();
    const { accountId, mesaId } = req.query;
    const { rating, comment } = req.body || {};
    
    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Not found' });
    const restaurantId = restData[0].id;

    const realTableId = await resolveMesaId(config, restaurantId, mesaId);
    if (!realTableId) return res.status(404).json({ error: 'Mesa no encontrada' });

    const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&order=created_at.desc&limit=1`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const sessionData = await sessionRes.json();
    const sessionId = sessionData && sessionData.length > 0 ? sessionData[0].id : null;
    
    await fetch(`${config.supabaseUrl}/rest/v1/table_feedback`, {
      method: 'POST',
      headers: { 
        apikey: config.supabaseWriteApiKey, 
        Authorization: `Bearer ${config.supabaseWriteApiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        table_id: realTableId,
        session_id: sessionId,
        rating,
        comment
      })
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
}
