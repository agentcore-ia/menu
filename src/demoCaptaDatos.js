function producto(id, name, unitPrice, description, image = '') {
  return {
    id,
    name,
    unitPrice,
    price: `$${unitPrice.toLocaleString('es-AR')}`,
    description,
    image,
    hasCustomImage: Boolean(image),
    availableForOrder: true,
  }
}

const locales = [
  {
    local: {
      slug: 'demo-dallys', nombre: 'Dally’s', categoriaNombre: 'Pizzería',
      portada: '/dallys/compartir.jpg', logo: '/dallys/logo.webp', tiempo: '30–50 min', color: '#cd4b24',
    },
    envio: 2500,
    categorias: [
      { id: 'pizzas', label: 'Pizzas', items: [
        producto('muzzarella', 'Pizza de muzzarella', 14500, 'Salsa de tomate, muzzarella y orégano.', '/dishes/pizza.jpg'),
        producto('napolitana', 'Pizza napolitana', 16800, 'Muzzarella, tomates frescos y ajo.'),
      ] },
      { id: 'empanadas', label: 'Empanadas', items: [
        producto('carne', 'Empanada de carne', 3500, 'Carne cortada a cuchillo y cebolla.'),
        producto('queso', 'Empanada de jamón y queso', 3500, 'Jamón cocido y muzzarella.'),
      ] },
    ],
  },
  {
    local: {
      slug: 'demo-boutique-cian', nombre: 'Boutique Cian', categoriaNombre: 'Panadería',
      portada: '/boutique-cian/compartir.jpg', logo: '/boutique-cian/icono.png', tiempo: '20–30 min', color: '#9b5836',
    },
    envio: 2200,
    categorias: [
      { id: 'facturas', label: 'Facturas', items: [
        producto('croissant', 'Croissant de manteca', 2600, 'Hojaldrado y dorado.'),
        producto('medialunas', 'Media docena de medialunas', 7800, 'Medialunas de manteca con almíbar.'),
      ] },
      { id: 'panes', label: 'Panes', items: [
        producto('focaccia', 'Focaccia de romero', 7200, 'Aceite de oliva, sal marina y romero.'),
      ] },
    ],
  },
  {
    local: {
      slug: 'demo-bruder', nombre: 'Bruder', categoriaNombre: 'Casa de comida',
      portada: '/bruderpizza/compartir.jpg', logo: '/bruderpizza/icono.png', tiempo: '45–70 min', color: '#b54623',
    },
    envio: 2800,
    categorias: [
      { id: 'especialidades', label: 'Especialidades', items: [
        producto('fugazzeta', 'Fugazzeta rellena', 18400, 'Muzzarella, cebolla y masa de la casa.'),
        producto('bastones', 'Bastones de muzzarella', 6900, 'Bastones crocantes con salsa de tomate.'),
      ] },
      { id: 'bebidas', label: 'Bebidas', items: [
        producto('limonada', 'Limonada casera', 4100, 'Limón, menta y hielo.', '/dishes/lemonade.jpg'),
      ] },
    ],
  },
]

export const comerciosDemo = locales.map((comercio) => ({
  ...comercio,
  local: { ...comercio.local, ciudad: 'Chivilcoy', abierto: true },
}))
