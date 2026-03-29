import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

vi.mock('../../src/db.js', () => ({ db: {} }))

vi.mock('../../src/clients/stock.client.js', () => ({
  stockClient: { reserve: vi.fn(), release: vi.fn(), consume: vi.fn() },
}))

// ─── Mocks de commands (mantém schemas reais para testar validação) ───────────

vi.mock('../../src/commands/create-order.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/create-order.command.js')>()
  return { ...mod, createOrderCommand: vi.fn() }
})

vi.mock('../../src/commands/add-item.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/add-item.command.js')>()
  return { ...mod, addItemCommand: vi.fn() }
})

vi.mock('../../src/commands/remove-item.command.js', () => ({
  removeItemCommand: vi.fn(),
}))

vi.mock('../../src/commands/close-order.command.js', () => ({
  closeOrderCommand: vi.fn(),
}))

vi.mock('../../src/commands/cancel-order.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/cancel-order.command.js')>()
  return { ...mod, cancelOrderCommand: vi.fn() }
})

// ─── Mocks de queries ─────────────────────────────────────────────────────────

vi.mock('../../src/queries/get-order.query.js', () => ({
  getOrderQuery: vi.fn(),
}))

vi.mock('../../src/queries/list-orders.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/list-orders.query.js')>()
  return { ...mod, listOrdersQuery: vi.fn() }
})

// ─── Imports após mocks ───────────────────────────────────────────────────────

const { buildApp } = await import('../../src/app.js')
const { createOrderCommand } = await import('../../src/commands/create-order.command.js')
const { addItemCommand } = await import('../../src/commands/add-item.command.js')
const { removeItemCommand } = await import('../../src/commands/remove-item.command.js')
const { closeOrderCommand } = await import('../../src/commands/close-order.command.js')
const { cancelOrderCommand } = await import('../../src/commands/cancel-order.command.js')
const { getOrderQuery } = await import('../../src/queries/get-order.query.js')
const { listOrdersQuery } = await import('../../src/queries/list-orders.query.js')
const { NotFoundError, BusinessError } = await import('../../src/helpers/errors.js')

// ─── Setup ────────────────────────────────────────────────────────────────────

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = buildApp()
  await app.ready()
})

// ─── POST /orders ─────────────────────────────────────────────────────────────

describe('POST /orders', () => {
  it('retorna 201 com id quando body é válido', async () => {
    vi.mocked(createOrderCommand).mockResolvedValue({ id: 'order-uuid' })

    const res = await app.inject({ method: 'POST', url: '/orders', payload: { table_number: 5 } })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ id: 'order-uuid' })
  })

  it('retorna 400 quando table_number está ausente', async () => {
    const res = await app.inject({ method: 'POST', url: '/orders', payload: {} })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando table_number é zero', async () => {
    const res = await app.inject({ method: 'POST', url: '/orders', payload: { table_number: 0 } })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando table_number é negativo', async () => {
    const res = await app.inject({ method: 'POST', url: '/orders', payload: { table_number: -1 } })
    expect(res.statusCode).toBe(400)
  })
})

// ─── GET /orders ──────────────────────────────────────────────────────────────

describe('GET /orders', () => {
  it('retorna 200 com lista paginada', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 }
    vi.mocked(listOrdersQuery).mockResolvedValue(mockResult)

    const res = await app.inject({ method: 'GET', url: '/orders' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockResult)
  })

  it('passa filtro de status para a query', async () => {
    vi.mocked(listOrdersQuery).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

    await app.inject({ method: 'GET', url: '/orders?status=open' })

    expect(listOrdersQuery).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
  })

  it('retorna 400 para status inválido', async () => {
    const res = await app.inject({ method: 'GET', url: '/orders?status=invalido' })
    expect(res.statusCode).toBe(400)
  })
})

// ─── GET /orders/:id ──────────────────────────────────────────────────────────

describe('GET /orders/:id', () => {
  it('retorna 200 com os dados do pedido', async () => {
    const mockOrder = { id: 'order-1', status: 'open', items: [] }
    vi.mocked(getOrderQuery).mockResolvedValue(mockOrder as any)

    const res = await app.inject({ method: 'GET', url: '/orders/order-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: 'order-1' })
  })

  it('retorna 404 quando pedido não existe', async () => {
    vi.mocked(getOrderQuery).mockRejectedValue(new NotFoundError('Pedido não encontrado'))

    const res = await app.inject({ method: 'GET', url: '/orders/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})

// ─── POST /orders/:id/items ───────────────────────────────────────────────────

describe('POST /orders/:id/items', () => {
  const validBody = { variant_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }

  it('retorna 201 com item_id quando body é válido', async () => {
    vi.mocked(addItemCommand).mockResolvedValue({ item_id: 'item-uuid' })

    const res = await app.inject({ method: 'POST', url: '/orders/order-1/items', payload: validBody })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ item_id: 'item-uuid' })
  })

  it('retorna 400 quando variant_id não é uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orders/order-1/items',
      payload: { variant_id: 'nao-uuid', quantity: 1 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando quantity é zero', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orders/order-1/items',
      payload: { variant_id: validBody.variant_id, quantity: 0 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 422 quando regra de negócio é violada', async () => {
    vi.mocked(addItemCommand).mockRejectedValue(new BusinessError('Pedido já está fechado'))

    const res = await app.inject({ method: 'POST', url: '/orders/order-1/items', payload: validBody })

    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ error: 'Pedido já está fechado' })
  })
})

// ─── DELETE /orders/:id/items/:itemId ────────────────────────────────────────

describe('DELETE /orders/:id/items/:itemId', () => {
  it('retorna 204 quando item é removido com sucesso', async () => {
    vi.mocked(removeItemCommand).mockResolvedValue(undefined)

    const res = await app.inject({ method: 'DELETE', url: '/orders/order-1/items/item-1' })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando item não existe', async () => {
    vi.mocked(removeItemCommand).mockRejectedValue(new NotFoundError('Item não encontrado'))

    const res = await app.inject({ method: 'DELETE', url: '/orders/order-1/items/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})

// ─── POST /orders/:id/close ───────────────────────────────────────────────────

describe('POST /orders/:id/close', () => {
  it('retorna 204 quando fechamento é bem-sucedido', async () => {
    vi.mocked(closeOrderCommand).mockResolvedValue(undefined)

    const res = await app.inject({ method: 'POST', url: '/orders/order-1/close' })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 422 ao tentar fechar pedido sem itens', async () => {
    vi.mocked(closeOrderCommand).mockRejectedValue(
      new BusinessError('Não é possível fechar um pedido sem itens'),
    )

    const res = await app.inject({ method: 'POST', url: '/orders/order-1/close' })

    expect(res.statusCode).toBe(422)
  })
})

// ─── POST /orders/:id/cancel ──────────────────────────────────────────────────

describe('POST /orders/:id/cancel', () => {
  it('retorna 204 com body vazio', async () => {
    vi.mocked(cancelOrderCommand).mockResolvedValue(undefined)

    const res = await app.inject({ method: 'POST', url: '/orders/order-1/cancel', payload: {} })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 204 com motivo opcional', async () => {
    vi.mocked(cancelOrderCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/orders/order-1/cancel',
      payload: { reason: 'cliente desistiu' },
    })

    expect(res.statusCode).toBe(204)
    expect(cancelOrderCommand).toHaveBeenCalledWith('order-1', { reason: 'cliente desistiu' })
  })
})
