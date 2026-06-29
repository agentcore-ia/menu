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
  try {
    const config = getServerConfig();
    const { accountId, mesaId, action } = req.query;

    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Account not found' });
    const restaurantId = restData[0].id;
    
    const realTableId = await resolveMesaId(config, restaurantId, mesaId);
    if (!realTableId) {
      if (action === 'orders' || action === 'session') return res.json(action === 'orders' ? [] : null);
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    if (req.method === 'GET' && action === 'orders') {
      const ordersRes = await fetch(`${config.supabaseUrl}/rest/v1/pedidos?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&status=in.(new,preparing,ready,delivering)&select=*,items_pedido(*)`, {
        headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
      });
      const ordersData = await ordersRes.json();
      return res.json(ordersData || []);
    }

    if (req.method === 'GET' && action === 'session') {
      const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&order=opened_at.desc&limit=1`, {
        headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
      });
      const sessionData = await sessionRes.json();
      return res.json(sessionData && sessionData.length > 0 ? sessionData[0] : null);
    }

    if (req.method === 'POST' && action === 'pay') {
      const { amount, payment_method } = req.body || {};
      const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&status=in.(open,pending_payment)&select=id&limit=1`, {
        headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
      });
      const sessionData = await sessionRes.json();
      
      if (!sessionData || sessionData.length === 0) {
        return res.status(400).json({ error: 'La mesa ya fue pagada o no tiene sesión activa' });
      }

      const sessionId = sessionData[0].id;
        
        if (payment_method === 'mercadopago' || payment_method === 'applepay') {
          const baseUrl = String(config.dashboardUrl || '').replace(/\/+$/, '');
          const serviceKey = config.internalServiceKey || config.supabaseWriteApiKey || config.supabaseApiKey;
  
          const mpRes = await fetch(`${baseUrl}/api/payments/mercadopago/create-table-preference`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-capta-service-key': serviceKey,
            },
            body: JSON.stringify({
              tableSessionId: sessionId,
              amount: amount,
              accountId: accountId
            })
          });
  
          if (mpRes.ok) {
            const prefData = await mpRes.json();
            return res.json({ success: true, payment_url: prefData.paymentLink });
          } else {
            const mpErr = await mpRes.text();
            console.error("Dashboard MP Preference Error:", mpErr);
            return res.status(500).json({ error: 'Failed to create payment preference via dashboard', details: mpErr });
          }
        } else {
          // Mock payment fallback
          await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              apikey: config.supabaseWriteApiKey, 
              Authorization: `Bearer ${config.supabaseWriteApiKey}`,
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ status: 'pending_payment' })
          });
          return res.json({ success: true });
        }
    }

    if (req.method === 'POST' && action === 'feedback') {
      const { rating, comment } = req.body || {};
      const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&order=opened_at.desc&limit=1`, {
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
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Action not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal error' });
  }
}
