import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { NotFoundError } from '../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { getStockQuery } = await import('../../../src/queries/stock/get-stock.query.js')

describe('getStockQuery', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna dados de estoque com campo available calculado', async () => {
    mocks.executeTakeFirst
      .mockResolvedValueOnce({ id: 'var-1' })   // variante existe
      .mockResolvedValueOnce({                   // stock_projection
        variant_id: 'var-1',
        quantity: 30,
        reserved: 8,
        updated_at: new Date(),
      })

    const result = await getStockQuery('var-1')

    expect(result.available).toBe(22) // 30 - 8
    expect(result.quantity).toBe(30)
    expect(result.reserved).toBe(8)
  })

  it('retorna estoque zerado quando variante existe mas não tem movimentação', async () => {
    mocks.executeTakeFirst
      .mockResolvedValueOnce({ id: 'var-1' }) // variante existe
      .mockResolvedValueOnce(undefined)        // sem stock_projection

    const result = await getStockQuery('var-1')

    expect(result).toMatchObject({ variant_id: 'var-1', quantity: 0, reserved: 0, available: 0 })
  })

  it('lança NotFoundError quando variante não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValueOnce(undefined)

    await expect(getStockQuery('nao-existe')).rejects.toThrow(NotFoundError)
  })
})
