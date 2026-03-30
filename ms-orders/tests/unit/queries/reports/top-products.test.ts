import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'
import { BusinessError } from '../../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { topProductsQuery } = await import('../../../../src/queries/reports/top-products.query.js')

const mockRows = [
  { variant_id: 'var-1', total_quantity: '50', total_revenue: '500' },
  { variant_id: 'var-2', total_quantity: '30', total_revenue: '300' },
]

describe('topProductsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.execute.mockResolvedValue(mockRows)
  })

  it('lança BusinessError quando start_date >= end_date', async () => {
    const input = {
      start_date: new Date('2025-01-31'),
      end_date: new Date('2025-01-01'),
      limit: 10,
    }

    await expect(topProductsQuery(input)).rejects.toThrow(BusinessError)
  })

  it('lança BusinessError quando start_date é igual a end_date', async () => {
    const sameDate = new Date('2025-01-15')
    const input = { start_date: sameDate, end_date: sameDate, limit: 10 }

    await expect(topProductsQuery(input)).rejects.toThrow(BusinessError)
  })

  it('retorna lista de produtos com quantidades convertidas para número', async () => {
    const result = await topProductsQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
      limit: 10,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      variant_id: 'var-1',
      total_quantity: 50,
      total_revenue: 500,
    })
    expect(result[1]).toEqual({
      variant_id: 'var-2',
      total_quantity: 30,
      total_revenue: 300,
    })
  })

  it('converte total_quantity e total_revenue para número', async () => {
    const result = await topProductsQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
      limit: 10,
    })

    expect(typeof result[0].total_quantity).toBe('number')
    expect(typeof result[0].total_revenue).toBe('number')
  })

  it('aplica limit na consulta', async () => {
    await topProductsQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
      limit: 5,
    })

    expect(mocks.limit).toHaveBeenCalledWith(5)
  })

  it('filtra por status closed', async () => {
    await topProductsQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
      limit: 10,
    })

    expect(mocks.where).toHaveBeenCalledWith('o.status', '=', 'closed')
  })

  it('retorna lista vazia quando não há produtos', async () => {
    mocks.execute.mockResolvedValue([])

    const result = await topProductsQuery({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31'),
      limit: 10,
    })

    expect(result).toEqual([])
  })
})
