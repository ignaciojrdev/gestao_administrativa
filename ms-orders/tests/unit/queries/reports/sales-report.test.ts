import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'
import { BusinessError } from '../../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { salesReportQuery } = await import('../../../../src/queries/reports/sales-report.query.js')

describe('salesReportQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.executeTakeFirstOrThrow.mockResolvedValue({
      total_revenue: 1500,
      order_count: 10,
    })
  })

  it('lança BusinessError quando start_date >= end_date', async () => {
    const input = {
      start_date: new Date('2025-01-31'),
      end_date: new Date('2025-01-01'),
    }

    await expect(salesReportQuery(input)).rejects.toThrow(BusinessError)
  })

  it('lança BusinessError quando start_date é igual a end_date', async () => {
    const sameDate = new Date('2025-01-15')
    const input = { start_date: sameDate, end_date: sameDate }

    await expect(salesReportQuery(input)).rejects.toThrow(BusinessError)
  })

  it('retorna total_revenue e order_count corretos', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({
      total_revenue: 3000,
      order_count: 20,
    })

    const result = await salesReportQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
    })

    expect(result.total_revenue).toBe(3000)
    expect(result.order_count).toBe(20)
  })

  it('calcula average_order_value corretamente', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({
      total_revenue: 1000,
      order_count: 3,
    })

    const result = await salesReportQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
    })

    expect(result.average_order_value).toBe(333.33)
  })

  it('retorna average_order_value zero quando não há pedidos', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({
      total_revenue: null,
      order_count: 0,
    })

    const result = await salesReportQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
    })

    expect(result.total_revenue).toBe(0)
    expect(result.order_count).toBe(0)
    expect(result.average_order_value).toBe(0)
  })

  it('retorna período com datas em formato ISO', async () => {
    const start = new Date('2025-03-01')
    const end = new Date('2025-03-31')

    const result = await salesReportQuery({ start_date: start, end_date: end })

    expect(result.period.start).toBe(start.toISOString())
    expect(result.period.end).toBe(end.toISOString())
  })

  it('converte valores de string para número', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({
      total_revenue: '2500',
      order_count: '5',
    })

    const result = await salesReportQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
    })

    expect(typeof result.total_revenue).toBe('number')
    expect(typeof result.order_count).toBe('number')
    expect(result.total_revenue).toBe(2500)
    expect(result.order_count).toBe(5)
  })

  it('filtra por status closed e intervalo de datas', async () => {
    await salesReportQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
    })

    expect(mocks.where).toHaveBeenCalledWith('status', '=', 'closed')
  })
})
