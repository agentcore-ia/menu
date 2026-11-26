// El canje de regalos en el servidor del menu, con la base simulada.
//
//   node --test shared/regalosCapta.servidor.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { SupabaseOrderRepository } from '../server/repositories/supabaseOrderRepository.js'

const TEL = '5492346512345'

/** Un repositorio cuya base es un par de listas en memoria. */
function repositorio({ puntos = 0, bonos = [] } = {}) {
  const repo = Object.create(SupabaseOrderRepository.prototype)
  const base = {
    bonos: bonos.map((b) => ({ restaurant_ids: [], producto_ids: [], paga: 'capta', vence_at: null, ...b })),
    usos: [],
    movimientos: [],
    cuenta: { id: 'c1', puntos, canjeados_total: 0 },
  }
  repo.request = async (ruta, opciones = {}) => {
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : null
    if (ruta.startsWith('/capta_puntos_config')) return [{ activo: true, valor_del_punto: 2, minimo_para_canjear: 250, tope_por_pedido: 3000, pesos_por_punto: 100 }]
    if (ruta.startsWith('/capta_puntos_cuentas')) {
      if (opciones.method === 'PATCH') Object.assign(base.cuenta, cuerpo)
      return [base.cuenta]
    }
    if (ruta.startsWith('/capta_puntos_movimientos')) {
      base.movimientos.push(...cuerpo)
      return []
    }
    if (ruta.startsWith('/capta_puntos_bonos_usos')) {
      base.usos.push(...cuerpo)
      return []
    }
    if (ruta.startsWith('/capta_puntos_bonos')) {
      const id = ruta.match(/id=eq\.([^&]+)/)?.[1]
      if (opciones.method === 'PATCH') {
        const antes = Number(ruta.match(/restantes=eq\.(\d+)/)[1])
        const fila = base.bonos.find((b) => b.id === id && b.restantes === antes)
        if (!fila) return []
        Object.assign(fila, cuerpo)
        return [fila]
      }
      return id ? base.bonos.filter((b) => b.id === id) : base.bonos.filter((b) => b.restantes > 0)
    }
    throw new Error(`consulta no esperada: ${ruta}`)
  }
  return { repo, base }
}

const pedido = { telefono: TEL, pesosPedidos: 99999, comida: 10000, envio: 2500, desdeVitrina: true, restaurant: { id: 'r1', slug: 'troka' }, items: [{ productId: 'p1', unitPrice: 10000, quantity: 1 }] }

test('usa el regalo del local y el saldo comun, y separa quien paga', async () => {
  const { repo, base } = repositorio({ puntos: 1000, bonos: [{ id: 'b1', restantes: 400, restaurant_ids: ['r1'], paga: 'local' }] })
  const canje = await repo.canjearPuntosDeCapta(pedido)
  assert.deepEqual([canje.pesosLocal, canje.pesosCapta, canje.pesos], [800, 2000, 2800])
  await repo.anotarCanjeDePuntos({ pedido: { id: 'o1', order_number: 7 }, canje })
  assert.equal(base.bonos[0].restantes, 0)
  assert.deepEqual(base.usos, [{ bono_id: 'b1', pedido_id: 'o1', puntos: 400, pesos: 800 }])
  assert.equal(base.cuenta.puntos, 0)
  assert.deepEqual(base.movimientos.map((m) => [m.puntos, m.pesos]), [[-1000, 2000]])
})

test('un regalo de otro local no se toca, y sin desde la app no hay nada', async () => {
  const { repo } = repositorio({ bonos: [{ id: 'b1', restantes: 400, restaurant_ids: ['r2'] }] })
  assert.equal((await repo.canjearPuntosDeCapta(pedido)).pesos, 0)
  const otro = repositorio({ bonos: [{ id: 'b1', restantes: 400 }] })
  assert.equal((await otro.repo.canjearPuntosDeCapta({ ...pedido, desdeVitrina: false })).pesos, 0)
  assert.equal((await otro.repo.canjearPuntosDeCapta({ ...pedido, pesosPedidos: 0 })).pesos, 0)
})

test('si el regalo cambio mientras tanto, no se gasta dos veces', async () => {
  const { repo, base } = repositorio({ bonos: [{ id: 'b1', restantes: 400 }] })
  const canje = await repo.canjearPuntosDeCapta(pedido)
  base.bonos[0].restantes = 0 // otro pedido lo uso antes
  await repo.anotarCanjeDePuntos({ pedido: { id: 'o2' }, canje })
  assert.equal(base.usos.length, 0)
  assert.equal(base.movimientos.length, 0, 'sin saldo comun no hay movimiento')
})
