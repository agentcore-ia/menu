const fs = require('fs');
let c = fs.readFileSync('src/MenuApp.jsx', 'utf8');

c = c.replace(
  /<strong>\{templateId === 'kika' \|\| templateId === 'almendra' \? 'En preparación' : 'Envio por WhatsApp'\}<\/strong>\s*<small>\s*\{templateId === 'kika' \|\| templateId === 'almendra'\s*\?\s*`El equipo de \$\{templateId === 'almendra' \? 'Almendra' : 'Kika'\} lo ver\? desde la cafeter\?a para prepararlo.`\s*:\s*lastOrder\.customerWhatsapp\?\.url\s*\?\s*'Se abrio el chat con el pedido listo para enviar\.'\s*:\s*'Te vamos a contactar para coordinar el pedido\.'\}\s*<\/small>/,
  `<strong>{isTableOrder || templateId === 'kika' || templateId === 'almendra' ? 'En preparación' : 'Envio por WhatsApp'}</strong>
                  <small>
                    {isTableOrder
                      ? 'El equipo del local ya recibió tu pedido y lo está preparando.'
                      : templateId === 'kika' || templateId === 'almendra'
                      ? \`El equipo de \${templateId === 'almendra' ? 'Almendra' : 'Kika'} lo verá desde el local para prepararlo.\`
                      : lastOrder.customerWhatsapp?.url
                      ? 'Se abrio el chat con el pedido listo para enviar.'
                      : 'Te vamos a contactar para coordinar el pedido.'}
                  </small>`
);

fs.writeFileSync('src/MenuApp.jsx', c);
console.log('Done');
