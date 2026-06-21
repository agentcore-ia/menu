const fs = require('fs');
let c = fs.readFileSync('server/repositories/supabaseOrderRepository.js', 'utf8');

const injection = `
    let resolvedTableId = null;
    if (payload.mesa_id) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.mesa_id);
      if (isUUID) {
        resolvedTableId = payload.mesa_id;
      } else {
        try {
          const decodedName = decodeURIComponent(payload.mesa_id).toLowerCase().trim();
          const tablesResponse = await this.request(\`/mesas?restaurant_id=eq.\${restaurant.id}\`, { method: 'GET' });
          const matchedTable = (tablesResponse || []).find(t => 
            t.name?.toLowerCase().trim() === decodedName || 
            t.name?.toLowerCase().trim() === \`mesa \${decodedName}\`
          );
          if (matchedTable) {
            resolvedTableId = matchedTable.id;
          }
        } catch(e) {
          console.error('Error resolving table:', e);
        }
      }
    }

    const [pedido] = await this.request('/pedidos', {`;

c = c.replace(
  /const \[pedido\] = await this\.request\('\/pedidos', \{/g,
  injection
);

c = c.replace(
  /table_id: payload\.mesa_id \|\| null,/g,
  `table_id: resolvedTableId,`
);

fs.writeFileSync('server/repositories/supabaseOrderRepository.js', c);
console.log('Update successful');
