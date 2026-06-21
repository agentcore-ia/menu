const fs = require('fs');
let c = fs.readFileSync('src/MenuApp.jsx', 'utf8');

c = c.replace(
  /\? 'Solo necesitamos tus datos para identificar el pedido en la cafetería\.'/g,
  `? 'Solo necesitamos tus datos para identificar el pedido en el local.'`
);

c = c.replace(
  /\? 'Pedido en cafetería'/g,
  `? 'Pedido en el local'`
);

c = c.replace(
  /\? 'Gracias\. Tu pedido ya quedó registrado para prepararlo en la cafetería\.'/g,
  `? 'Gracias. Tu pedido ya quedó registrado para prepararlo en el local.'`
);

c = c.replace(
  /lo verá desde la cafetería para prepararlo\./g,
  `lo verá desde el local para prepararlo.`
);

fs.writeFileSync('src/MenuApp.jsx', c);
console.log('Update successful');
