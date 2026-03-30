import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { getStockHistoryQuery } = await import('../../../../src/queries/stock/get-stock-history.query.js')

describe('getStockHistoryQuery', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna histórico paginado com dados e total', async () => {
    const mockRows = [
      { id: 'evt-1', type: 'STOCK_IN', data: { quantity: 10 }, created_at: new Date() },
      { id: 'evt-2', type: 'STOCK_OUT', data: { quantity: 5 }, created_at: new Date() },
    ]
    mocks.execute.mockResolvedValue(mockRows)
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 2 })

    const result = await getStockHistoryQuery('var-1', { page: 1, limit: 20 })

    expect(result.data).toEqual(mockRows)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('calcula offset corretamente para página 1', async () => {
    mocks.execute.mockResolvedValue([])
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 0 })

    await getStockHistoryQuery('var-1', { page: 1, limit: 20 })

    expect(mocks.offset).toHaveBeenCalledWith(0)
  })

  it('calcula offset corretamente para página 3 com limit 10', async () => {
    mocks.execute.mockResolvedValue([])
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 0 })

    await getStockHistoryQuery('var-1', { page: 3, limit: 10 })

    expect(mocks.offset).toHaveBeenCalledWith(20)
  })

  it('filtra por aggregate_id da variante', async () => {
    mocks.execute.mockResolvedValue([])
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 0 })

    await getStockHistoryQuery('var-abc', { page: 1, limit: 20 })

    expect(mocks.where).toHaveBeenCalledWith('aggregate_id', '=', 'var-abc')
  })

  it('retorna lista vazia quando não há eventos', async () => {
    mocks.execute.mockResolvedValue([])
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 0 })

    const result = await getStockHistoryQuery('var-1', { page: 1, limit: 20 })

    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })
})
