import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { STOCK_EVENT_TYPE } from '../../../src/constants/stock.constants.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { loadStockState } = await import('../../../src/helpers/load-stock-state.js')

describe('loadStockState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna null quando não há eventos para a variante', async () => {
    mocks.execute.mockResolvedValue([])

    const result = await loadStockState('var-1')

    expect(result).toBeNull()
  })

  it('retorna estado reconstruído quando há eventos', async () => {
    mocks.execute.mockResolvedValue([
      { id: 'e1', aggregate_id: 'var-1', type: STOCK_EVENT_TYPE.STOCK_IN, data: { quantity: 30, reason: 'purchase' }, created_at: new Date() },
      { id: 'e2', aggregate_id: 'var-1', type: STOCK_EVENT_TYPE.STOCK_RESERVED, data: { quantity: 5, order_id: 'order-1' }, created_at: new Date() },
    ])

    const result = await loadStockState('var-1')

    expect(result).toEqual({ variant_id: 'var-1', quantity: 30, reserved: 5 })
  })

  it('filtra eventos pelo variantId correto', async () => {
    mocks.execute.mockResolvedValue([])

    await loadStockState('var-especifica')

    expect(mocks.where).toHaveBeenCalledWith('aggregate_id', '=', 'var-especifica')
  })
})
