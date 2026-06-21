const fs = require('fs');
let c = fs.readFileSync('server/repositories/supabaseOrderRepository.js', 'utf8');

c = c.replace(
  /source: 'menu_digital',\n\s*transcription: \{\n\s*channel: 'menu_digital',/g,
  `source: payload.mesa_id ? 'qr_mesa' : 'menu_digital',\n          table_id: payload.mesa_id || null,\n          transcription: {\n            channel: payload.mesa_id ? 'qr_mesa' : 'menu_digital',`
);

fs.writeFileSync('server/repositories/supabaseOrderRepository.js', c);
console.log('Update successful');
