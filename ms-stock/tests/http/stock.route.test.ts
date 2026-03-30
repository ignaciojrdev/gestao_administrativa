import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

vi.mock('../../src/db.js', () => ({ db: {} }))

// ─── Mocks de commands (mantém schemas reais para testar validação) ───────────

vi.mock('../../src/commands/stock/stock-in.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/stock/stock-in.command.js')>()
  return { ...mod, stockInCommand: vi.fn() }
})

vi.mock('../../src/commands/stock/stock-out.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/stock/stock-out.command.js')>()
  return { ...mod, stockOutCommand: vi.fn() }
})

vi.mock('../../src/commands/stock/reserve-stock.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/stock/reserve-stock.command.js')>()
  return { ...mod, reserveStockCommand: vi.fn() }
})

vi.mock('../../src/commands/stock/release-stock.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/stock/release-stock.command.js')>()
  return { ...mod, releaseStockCommand: vi.fn() }
})

vi.mock('../../src/commands/stock/consume-stock.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/stock/consume-stock.command.js')>()
  return { ...mod, consumeStockCommand: vi.fn() }
})

// ─── Mocks de queries ─────────────────────────────────────────────────────────

vi.mock('../../src/queries/stock/get-stock.query.js', () => ({
  getStockQuery: vi.fn(),
}))

vi.mock('../../src/queries/stock/list-stock.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/stock/list-stock.query.js')>()
  return { ...mod, listStockQuery: vi.fn() }
})

vi.mock('../../src/queries/stock/get-stock-history.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/stock/get-stock-history.query.js')>()
  return { ...mod, getStockHistoryQuery: vi.fn() }
})

// ─── Imports após mocks ───────────────────────────────────────────────────────

const { buildApp } = await import('../../src/app.js')
const { stockInCommand } = await import('../../src/commands/stock/stock-in.command.js')
const { stockOutCommand } = await import('../../src/commands/stock/stock-out.command.js')
const { reserveStockCommand } = await import('../../src/commands/stock/reserve-stock.command.js')
const { releaseStockCommand } = await import('../../src/commands/stock/release-stock.command.js')
const { consumeStockCommand } = await import('../../src/commands/stock/consume-stock.command.js')
const { getStockQuery } = await import('../../src/queries/stock/get-stock.query.js')
const { listStockQuery } = await import('../../src/queries/stock/list-stock.query.js')
const { getStockHistoryQuery } = await import('../../src/queries/stock/get-stock-history.query.js')
const { NotFoundError, BusinessError } = await import('../../src/helpers/errors.js')

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

// ─── Setup ────────────────────────────────────────────────────────────────────

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = buildApp()
  await app.ready()
})

// ─── GET /stock ───────────────────────────────────────────────────────────────

describe('GET /stock', () => {
  it('retorna 200 com lista paginada', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 }
    vi.mocked(listStockQuery).mockResolvedValue(mockResult)

    const res = await app.inject({ method: 'GET', url: '/stock' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockResult)
  })

  it('passa filtro low_stock para a query', async () => {
    vi.mocked(listStockQuery).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

    await app.inject({ method: 'GET', url: '/stock?low_stock=true&low_stock_threshold=3' })

    expect(listStockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ low_stock: true, low_stock_threshold: 3 }),
    )
  })
})

// ─── GET /stock/:variantId ────────────────────────────────────────────────────

describe('GET /stock/:variantId', () => {
  it('retorna 200 com dados de estoque', async () => {
    const mockStock = { variant_id: 'var-1', quantity: 20, reserved: 5, available: 15, updated_at: new Date() }
    vi.mocked(getStockQuery).mockResolvedValue(mockStock)

    const res = await app.inject({ method: 'GET', url: '/stock/var-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ variant_id: 'var-1', quantity: 20 })
  })

  it('retorna 404 quando variante não existe', async () => {
    vi.mocked(getStockQuery).mockRejectedValue(new NotFoundError('Variante não encontrada'))

    const res = await app.inject({ method: 'GET', url: '/stock/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})

// ─── POST /stock/:variantId/in ────────────────────────────────────────────────

describe('POST /stock/:variantId/in', () => {
  it('retorna 204 com body válido', async () => {
    vi.mocked(stockInCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/in',
      payload: { quantity: 10, reason: 'purchase' },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 400 quando quantity é zero', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/in',
      payload: { quantity: 0, reason: 'purchase' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando reason é inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/in',
      payload: { quantity: 5, reason: 'loss' }, // loss não é válido para stock-in
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 404 quando variante não existe', async () => {
    vi.mocked(stockInCommand).mockRejectedValue(new NotFoundError('Variante não encontrada'))

    const res = await app.inject({
      method: 'POST',
      url: '/stock/nao-existe/in',
      payload: { quantity: 5, reason: 'purchase' },
    })

    expect(res.statusCode).toBe(404)
  })
})

// ─── POST /stock/:variantId/out ───────────────────────────────────────────────

describe('POST /stock/:variantId/out', () => {
  it('retorna 204 com body válido', async () => {
    vi.mocked(stockOutCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/out',
      payload: { quantity: 5, reason: 'loss' },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 422 quando estoque insuficiente', async () => {
    vi.mocked(stockOutCommand).mockRejectedValue(new BusinessError('Estoque insuficiente'))

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/out',
      payload: { quantity: 9999, reason: 'manual' },
    })

    expect(res.statusCode).toBe(422)
  })
})

// ─── POST /stock/:variantId/reserve ──────────────────────────────────────────

describe('POST /stock/:variantId/reserve', () => {
  it('retorna 204 com body válido', async () => {
    vi.mocked(reserveStockCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/reserve',
      payload: { quantity: 3, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 400 quando order_id não é uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/reserve',
      payload: { quantity: 3, order_id: 'nao-uuid' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('retorna 422 quando estoque disponível é insuficiente', async () => {
    vi.mocked(reserveStockCommand).mockRejectedValue(
      new BusinessError('Estoque insuficiente: disponível 2, solicitado 5'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/reserve',
      payload: { quantity: 5, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json().error).toContain('Estoque insuficiente')
  })
})

// ─── POST /stock/:variantId/release ──────────────────────────────────────────

describe('POST /stock/:variantId/release', () => {
  it('retorna 204 com body válido', async () => {
    vi.mocked(releaseStockCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/release',
      payload: { quantity: 3, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 422 quando reserva é insuficiente', async () => {
    vi.mocked(releaseStockCommand).mockRejectedValue(new BusinessError('Reserva insuficiente'))

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/release',
      payload: { quantity: 99, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(422)
  })
})

// ─── POST /stock/:variantId/consume ──────────────────────────────────────────

describe('POST /stock/:variantId/consume', () => {
  it('retorna 204 com body válido', async () => {
    vi.mocked(consumeStockCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/consume',
      payload: { quantity: 3, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(204)
  })

  it('aceita idempotency_key opcional', async () => {
    vi.mocked(consumeStockCommand).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/consume',
      payload: { quantity: 3, order_id: VALID_UUID, idempotency_key: VALID_UUID },
    })

    expect(res.statusCode).toBe(204)
    expect(consumeStockCommand).toHaveBeenCalledWith(
      'var-1',
      expect.objectContaining({ idempotency_key: VALID_UUID }),
    )
  })

  it('retorna 422 quando reserva é insuficiente para consumo', async () => {
    vi.mocked(consumeStockCommand).mockRejectedValue(new BusinessError('Reserva insuficiente'))

    const res = await app.inject({
      method: 'POST',
      url: '/stock/var-1/consume',
      payload: { quantity: 99, order_id: VALID_UUID },
    })

    expect(res.statusCode).toBe(422)
  })
})

// ─── GET /stock/:variantId/history ──────────────────────────────────────────

describe('GET /stock/:variantId/history', () => {
  it('retorna 200 com histórico paginado', async () => {
    const mockResult = {
      data: [
        { id: 'evt-1', type: 'STOCK_IN', data: { quantity: 10 }, created_at: '2026-01-01T00:00:00.000Z' },
      ],
      total: 1,
      page: 1,
      limit: 20,
    }
    vi.mocked(getStockHistoryQuery).mockResolvedValue(mockResult)

    const res = await app.inject({ method: 'GET', url: '/stock/var-1/history' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockResult)
  })

  it('passa parâmetros de paginação para a query', async () => {
    vi.mocked(getStockHistoryQuery).mockResolvedValue({ data: [], total: 0, page: 2, limit: 10 })

    await app.inject({ method: 'GET', url: '/stock/var-1/history?page=2&limit=10' })

    expect(getStockHistoryQuery).toHaveBeenCalledWith(
      'var-1',
      expect.objectContaining({ page: 2, limit: 10 }),
    )
  })

  it('usa valores padrão quando paginação não é informada', async () => {
    vi.mocked(getStockHistoryQuery).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

    await app.inject({ method: 'GET', url: '/stock/var-1/history' })

    expect(getStockHistoryQuery).toHaveBeenCalledWith(
      'var-1',
      expect.objectContaining({ page: 1, limit: 20 }),
    )
  })
})
