import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

vi.mock('../../src/db.js', () => ({ db: {} }))

vi.mock('../../src/clients/stock.client.js', () => ({
  stockClient: { reserve: vi.fn(), release: vi.fn(), consume: vi.fn() },
}))

// ─── Mocks de queries de relatório ───────────────────────────────────────────

vi.mock('../../src/queries/reports/sales-report.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/reports/sales-report.query.js')>()
  return { ...mod, salesReportQuery: vi.fn() }
})

vi.mock('../../src/queries/reports/top-products.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/reports/top-products.query.js')>()
  return { ...mod, topProductsQuery: vi.fn() }
})

// ─── Imports após mocks ───────────────────────────────────────────────────────

const { buildApp } = await import('../../src/app.js')
const { salesReportQuery } = await import('../../src/queries/reports/sales-report.query.js')
const { topProductsQuery } = await import('../../src/queries/reports/top-products.query.js')
const { BusinessError } = await import('../../src/helpers/errors.js')

// ─── Setup ────────────────────────────────────────────────────────────────────

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = buildApp()
  await app.ready()
})

// ─── GET /reports/sales ───────────────────────────────────────────────────────

describe('GET /reports/sales', () => {
  const validQuery = '?start_date=2025-01-01&end_date=2025-01-31'

  const mockReport = {
    total_revenue: 1500.50,
    order_count: 10,
    average_order_value: 150.05,
    period: { start: '2025-01-01T00:00:00.000Z', end: '2025-01-31T00:00:00.000Z' },
  }

  it('retorna 200 com relatório de vendas', async () => {
    vi.mocked(salesReportQuery).mockResolvedValue(mockReport)

    const res = await app.inject({ method: 'GET', url: `/reports/sales${validQuery}` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockReport)
  })

  it('passa parâmetros corretos para a query', async () => {
    vi.mocked(salesReportQuery).mockResolvedValue(mockReport)

    await app.inject({ method: 'GET', url: `/reports/sales${validQuery}` })

    expect(salesReportQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: expect.any(Date),
        end_date: expect.any(Date),
      }),
    )
  })

  it('retorna 400 quando start_date está ausente', async () => {
    const res = await app.inject({ method: 'GET', url: '/reports/sales?end_date=2025-01-31' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando end_date está ausente', async () => {
    const res = await app.inject({ method: 'GET', url: '/reports/sales?start_date=2025-01-01' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 422 quando regra de negócio é violada', async () => {
    vi.mocked(salesReportQuery).mockRejectedValue(new BusinessError('Intervalo de datas inválido'))

    const res = await app.inject({ method: 'GET', url: `/reports/sales${validQuery}` })

    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ error: 'Intervalo de datas inválido' })
  })
})

// ─── GET /reports/top-products ────────────────────────────────────────────────

describe('GET /reports/top-products', () => {
  const validQuery = '?start_date=2025-01-01&end_date=2025-01-31'

  const mockProducts = [
    { variant_id: 'var-1', total_quantity: 50, total_revenue: 500 },
    { variant_id: 'var-2', total_quantity: 30, total_revenue: 300 },
  ]

  it('retorna 200 com lista de produtos mais vendidos', async () => {
    vi.mocked(topProductsQuery).mockResolvedValue(mockProducts)

    const res = await app.inject({ method: 'GET', url: `/reports/top-products${validQuery}` })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockProducts)
  })

  it('passa parâmetros corretos para a query', async () => {
    vi.mocked(topProductsQuery).mockResolvedValue(mockProducts)

    await app.inject({ method: 'GET', url: `/reports/top-products${validQuery}&limit=5` })

    expect(topProductsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: expect.any(Date),
        end_date: expect.any(Date),
        limit: 5,
      }),
    )
  })

  it('usa limit padrão quando não fornecido', async () => {
    vi.mocked(topProductsQuery).mockResolvedValue(mockProducts)

    await app.inject({ method: 'GET', url: `/reports/top-products${validQuery}` })

    expect(topProductsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    )
  })

  it('retorna 400 quando start_date está ausente', async () => {
    const res = await app.inject({ method: 'GET', url: '/reports/top-products?end_date=2025-01-31' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 422 quando regra de negócio é violada', async () => {
    vi.mocked(topProductsQuery).mockRejectedValue(new BusinessError('Intervalo de datas inválido'))

    const res = await app.inject({ method: 'GET', url: `/reports/top-products${validQuery}` })

    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ error: 'Intervalo de datas inválido' })
  })
})
