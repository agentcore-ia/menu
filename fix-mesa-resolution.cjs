const fs = require('fs');
const path = 'server/repositories/supabaseOrderRepository.js';
let c = fs.readFileSync(path, 'utf8');

// Fix 1: Better mesa resolution with select=id,name and fallback name storage
const oldMesaBlock = `    let resolvedTableId = null;\n    if (payload.mesa_id) {\n      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.mesa_id);\n      if (isUUID) {\n        resolvedTableId = payload.mesa_id;\n      } else {\n        try {\n          const decodedName = decodeURIComponent(payload.mesa_id).toLowerCase().trim();\n          const tablesResponse = await this.request(\`/mesas?restaurant_id=eq.\${restaurant.id}\`, { method: 'GET' });\n          const matchedTable = (tablesResponse || []).find(t => \n            t.name?.toLowerCase().trim() === decodedName || \n            t.name?.toLowerCase().trim() === \`mesa \${decodedName}\`\n          );\n          if (matchedTable) {\n            resolvedTableId = matchedTable.id;\n          }\n        } catch(e) {\n          console.error('Error resolving table:', e);\n        }\n      }\n    }`;

const newMesaBlock = `    let resolvedTableId = null;\n    let resolvedTableName = null;\n    if (payload.mesa_id) {\n      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.mesa_id);\n      if (isUUID) {\n        resolvedTableId = payload.mesa_id;\n      } else {\n        try {\n          const decodedName = decodeURIComponent(payload.mesa_id).toLowerCase().trim();\n          const tablesResponse = await this.request(\n            \`/mesas?restaurant_id=eq.\${restaurant.id}&select=id,name\`,\n            { method: 'GET' }\n          );\n          const matchedTable = (tablesResponse || []).find(t =>\n            t.name?.toLowerCase().trim() === decodedName ||\n            t.name?.toLowerCase().trim() === \`mesa \${decodedName}\` ||\n            t.name?.toLowerCase().trim() === \`mesa\${decodedName}\`\n          );\n          if (matchedTable) {\n            resolvedTableId = matchedTable.id;\n            resolvedTableName = matchedTable.name;\n          } else {\n            // No encontramos la mesa, al menos guardamos el nombre del param\n            resolvedTableName = \`Mesa \${decodeURIComponent(payload.mesa_id)}\`;\n          }\n        } catch(e) {\n          console.error('Error resolving table:', e);\n          resolvedTableName = \`Mesa \${payload.mesa_id}\`;\n        }\n      }\n    }`;

if (!c.includes(oldMesaBlock)) {
  console.error('ERROR: Could not find mesa block to replace');
  process.exit(1);
}
c = c.replace(oldMesaBlock, newMesaBlock);

// Fix 2: Store mesa_name in transcription and add notes fallback
const oldTranscription = `          source: payload.mesa_id ? 'qr_mesa' : 'menu_digital',\n          table_id: resolvedTableId,\n          transcription: {\n            channel: payload.mesa_id ? 'qr_mesa' : 'menu_digital',\n            customer: payload.customer,`;

const newTranscription = `          source: payload.mesa_id ? 'qr_mesa' : 'menu_digital',\n          table_id: resolvedTableId,\n          notes: resolvedTableName ? \`Pedido de \${resolvedTableName}\` : (payload.notes || null),\n          transcription: {\n            channel: payload.mesa_id ? 'qr_mesa' : 'menu_digital',\n            mesa_name: resolvedTableName || null,\n            customer: payload.customer,`;

if (!c.includes(oldTranscription)) {
  console.error('ERROR: Could not find transcription block to replace');
  process.exit(1);
}
c = c.replace(oldTranscription, newTranscription);

fs.writeFileSync(path, c);
console.log('Done. Mesa resolution fixed successfully.');
