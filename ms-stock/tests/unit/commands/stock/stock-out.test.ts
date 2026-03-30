import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BusinessError } from '../../../../src/helpers/errors.js'
import { STOCK_EVENT_TYPE } from '../../../../src/constants/stock.constants.js'

vi.mock('../../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../../src/helpers/persist-event.js', () => ({ persistEvent: vi.fn() }))
vi.mock('../../../../src/helpers/load-stock-state.js', () => ({ loadStockState: vi.fn() }))

const { stockOutCommand } = await import('../../../../src/commands/stock/stock-out.command.js')
const { persistEvent } = await import('../../../../src/helpers/persist-event.js')
const { loadStockState } = await import('../../../../src/helpers/load-stock-state.js')

describe('stockOutCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama persistEvent com evento StockOut quando estoque é suficiente', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 30, reserved: 5 })

    await stockOutCommand('var-1', { quantity: 10, reason: 'manual' })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STOCK_EVENT_TYPE.STOCK_OUT,
        variant_id: 'var-1',
        data: { quantity: 10, reason: 'manual' },
      }),
    )
  })

  it('lança BusinessError quando estado de estoque não existe', async () => {
    vi.mocked(loadStockState).mockResolvedValue(null)

    await expect(stockOutCommand('var-1', { quantity: 5, reason: 'loss' })).rejects.toThrow(
      BusinessError,
    )
  })

  it('lança BusinessError quando quantidade excede o disponível', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 10, reserved: 5 })

    // disponível = 5, solicitado = 6
    await expect(stockOutCommand('var-1', { quantity: 6, reason: 'loss' })).rejects.toThrow(
      BusinessError,
    )
    expect(persistEvent).not.toHaveBeenCalled()
  })
})
