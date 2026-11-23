import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aplicarConfigVitrina,
  bannersVitrina,
  categoriaDeVitrina,
  gruposVisibles,
  nombreDeCategoria,
  normalizarConfigVitrina,
  seccionVitrina,
  textoVitrina,
} from './vitrinaCapta.js'

test('sin configuracion queda todo de fabrica', () => {
  aplicarConfigVitrina(null)
  assert.equal(nombreDeCategoria('sushi'), 'Sushi')
  assert.equal(gruposVisibles().length, 10)
  assert.equal(textoVitrina('explora'), 'Explorá')
  assert.equal(seccionVitrina('explora'), true)
  assert.equal(bannersVitrina(), null)
})

test('el admin cambia nombres, cuadrados, textos, secciones y banners', () => {
  aplicarConfigVitrina({
    categorias: [{ id: 'sushi', label: 'Sushis', singular: 'Sushi bar' }, { id: 'bar-nuevo', label: 'Bares nuevos' }],
    grupos: [
      { id: 'comida', label: 'Comida rica', categorias: ['comida', 'sushi', 'bar-nuevo', 'no-existe'], visible: true },
      { id: 'oculto', label: 'Oculto', categorias: ['kiosco'], visible: false },
      { id: 'vacio', label: 'Vacio', categorias: [] },
    ],
    textos: { explora: 'Descubrí' },
    secciones: { explora: false },
    banners: [{ imagen: 'https://ejemplo.com/a.png', link: '/pedi' }],
  })
  assert.equal(nombreDeCategoria('sushi'), 'Sushi bar')
  assert.equal(nombreDeCategoria('sushi', { plural: true }), 'Sushis')
  assert.equal(nombreDeCategoria('bar-nuevo'), 'Bares nuevos')
  // Las de fabrica que el admin no nombro se conservan.
  assert.equal(nombreDeCategoria('farmacia'), 'Farmacia')
  assert.deepEqual(gruposVisibles().map((g) => g.label), ['Comida rica'])
  assert.deepEqual(gruposVisibles()[0].categorias, ['comida', 'sushi', 'bar-nuevo'])
  assert.equal(textoVitrina('explora'), 'Descubrí')
  assert.equal(textoVitrina('categorias'), 'Categorías')
  assert.equal(seccionVitrina('explora'), false)
  assert.equal(seccionVitrina('categorias'), true)
  assert.equal(bannersVitrina().length, 1)
  assert.equal(categoriaDeVitrina({ captaCategoria: 'bar-nuevo' }), 'bar-nuevo')
  aplicarConfigVitrina(null)
  assert.equal(nombreDeCategoria('sushi'), 'Sushi')
  assert.equal(gruposVisibles().length, 10)
})

test('lo peligroso o roto se descarta', () => {
  const c = normalizarConfigVitrina({
    categorias: [{ id: 'Con Espacios', label: 'x' }, { id: 'ok-1', label: '' }, { id: 'bien', label: 'Bien' }, { id: 'bien', label: 'Repetida' }],
    grupos: [{ id: 'g1', label: 'G', categorias: ['bien'], imagen: 'javascript:alert(1)', fondo: 'rojo' }],
    banners: [{ imagen: 'javascript:alert(1)' }, { imagen: '//evil.com/x.png' }, { imagen: '/capta/hero.webp', link: 'javascript:1' }],
    textos: { explora: '   ', otraCosa: 'x' },
    secciones: { explora: 'si', promos: false },
  })
  assert.deepEqual(c.categorias.map((x) => x.id), ['bien'])
  assert.equal(c.grupos[0].imagen, '')
  assert.equal(c.grupos[0].fondo, '#fdebde')
  assert.deepEqual(c.banners.map((b) => b.imagen), ['/capta/hero.webp'])
  assert.equal(c.banners[0].link, '')
  assert.deepEqual(c.textos, {})
  assert.deepEqual(c.secciones, { promos: false })
})

test('una configuracion basura no rompe nada', () => {
  for (const basura of [undefined, null, 5, 'x', [], { categorias: 'x', grupos: 7, banners: {} }]) {
    aplicarConfigVitrina(basura)
    assert.ok(gruposVisibles().length > 0)
    assert.equal(nombreDeCategoria('comida'), 'Casa de comida')
  }
  aplicarConfigVitrina(null)
})
