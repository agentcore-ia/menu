import { getServerConfig } from '../../../server/config.js'

async function resolveMesaId(config, restaurantId, mesaIdParam) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mesaIdParam)) {
    return mesaIdParam;
  }
  const decodedName = decodeURIComponent(mesaIdParam).toLowerCase().trim();
  const res = await fetch(\`\${config.supabaseUrl}/rest/v1/mesas?restaurant_id=eq.\${restaurantId}&select=id,name\`, {
    headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
  });
  const tables = await res.json();
  const matched = (tables || []).find(t => 
    t.name?.toLowerCase().trim() === decodedName ||
    t.name?.toLowerCase().trim() === \`mesa \${decodedName}\` ||
    t.name?.toLowerCase().trim() === \`mesa\${decodedName}\`
  );
  return matched ? matched.id : null;
}

function getActionSegments(req) {
  const actionParam = req.query?.action ?? req.query?.['...action'];
  if (Array.isArray(actionParam)) return actionParam;
  if (typeof actionParam === 'string') return actionParam.split('/');

  const pathname = new URL(req.url ?? '', 'https://menu.local').pathname;
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const accountsIdx = segments.findIndex(s => s === 'accounts');
  if (accountsIdx !== -1 && segments.length > accountsIdx + 2) {
    return segments.slice(accountsIdx + 2);
  }
  return [];
}

export default async function handler(req, res) {
  try {
    const config = getServerConfig();
    const accountId = req.query.accountId || getAccountIdFallback(req);
    const action = getActionSegments(req);

    if (action[0] !== 'tables' || action.length < 3) {
      return res.status(404).json({ error: 'Not found route' });
    }

    const mesaId = action[1];
    const subAction = action[2];

    const restRes = await fetch(\`\${config.supabaseUrl}/rest/v1/restaurants?slug=eq.\${encodeURIComponent(accountId)}&select=id\`, {
      headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Account not found' });
    const restaurantId = restData[0].id;
    
    const realTableId = await resolveMesaId(config, restaurantId, mesaId);
    if (!realTableId) {
      if (subAction === 'orders' || subAction === 'session') return res.json(subAction === 'orders' ? [] : null);
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    if (req.method === 'GET' && subAction === 'orders') {
      const ordersRes = await fetch(\`\${config.supabaseUrl}/rest/v1/pedidos?restaurant_id=eq.\${restaurantId}&table_id=eq.\${realTableId}&status=in.(new,preparing,ready,delivering)&select=*,items_pedido(*)\`, {
        headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
      });
      const ordersData = await ordersRes.json();
      return res.json(ordersData || []);
    }

    if (req.method === 'GET' && subAction === 'session') {
      const sessionRes = await fetch(\`\${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.\${restaurantId}&table_id=eq.\${realTableId}&status=eq.active&select=*&limit=1\`, {
        headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
      });
      const sessionData = await sessionRes.json();
      return res.json(sessionData && sessionData.length > 0 ? sessionData[0] : null);
    }

    if (req.method === 'POST' && subAction === 'pay') {
      const sessionRes = await fetch(\`\${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.\${restaurantId}&table_id=eq.\${realTableId}&status=eq.active&select=*&limit=1\`, {
        headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
      });
      const sessionData = await sessionRes.json();
      if (!sessionData || sessionData.length === 0) {
        return res.status(400).json({ error: 'No hay sesión activa' });
      }
      const sessionId = sessionData[0].id;
      await fetch(\`\${config.supabaseUrl}/rest/v1/table_sessions?id=eq.\${sessionId}\`, {
        method: 'PATCH',
        headers: { 
          apikey: config.supabaseWriteApiKey, 
          Authorization: \`Bearer \${config.supabaseWriteApiKey}\`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          status: 'paid',
          paid_amount: sessionData[0].pending_amount,
          pending_amount: 0
        })
      });
      return res.json({ success: true });
    }

    if (req.method === 'POST' && subAction === 'feedback') {
      const { rating, comment } = req.body || {};
      const sessionRes = await fetch(\`\${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.\${restaurantId}&table_id=eq.\${realTableId}&order=created_at.desc&limit=1\`, {
        headers: { apikey: config.supabaseApiKey, Authorization: \`Bearer \${config.supabaseApiKey}\` }
      });
      const sessionData = await sessionRes.json();
      const sessionId = sessionData && sessionData.length > 0 ? sessionData[0].id : null;
      await fetch(\`\${config.supabaseUrl}/rest/v1/table_feedback\`, {
        method: 'POST',
        headers: { 
          apikey: config.supabaseWriteApiKey, 
          Authorization: \`Bearer \${config.supabaseWriteApiKey}\`,
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
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found in action' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal error' });
  }
}

function getAccountIdFallback(req) {
  const pathname = new URL(req.url ?? '', 'https://menu.local').pathname;
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const accountsIdx = segments.findIndex(s => s === 'accounts');
  if (accountsIdx !== -1 && segments.length > accountsIdx + 1) {
    return segments[accountsIdx + 1];
  }
  return '';
}
