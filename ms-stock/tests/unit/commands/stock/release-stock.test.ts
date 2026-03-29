import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BusinessError } from '../../../../src/helpers/errors.js'
import { STOCK_EVENT_TYPE } from '../../../../src/constants/stock.constants.js'

vi.mock('../../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../../src/helpers/persist-event.js', () => ({ persistEvent: vi.fn() }))
vi.mock('../../../../src/helpers/load-stock-state.js', () => ({ loadStockState: vi.fn() }))

const { releaseStockCommand } = await import('../../../../src/commands/stock/release-stock.command.js')
const { persistEvent } = await import('../../../../src/helpers/persist-event.js')
const { loadStockState } = await import('../../../../src/helpers/load-stock-state.js')

const ORDER_ID = '550e8400-e29b-41d4-a716-446655440000'

describe('releaseStockCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama persistEvent com StockReleased quando reserva é suficiente', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 20, reserved: 10 })

    await releaseStockCommand('var-1', { quantity: 5, order_id: ORDER_ID })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STOCK_EVENT_TYPE.STOCK_RELEASED,
        variant_id: 'var-1',
        data: { quantity: 5, order_id: ORDER_ID },
      }),
      undefined,
    )
  })

  it('lança BusinessError quando reserva é insuficiente', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 20, reserved: 3 })

    await expect(
      releaseStockCommand('var-1', { quantity: 5, order_id: ORDER_ID }),
    ).rejects.toThrow(BusinessError)

    expect(persistEvent).not.toHaveBeenCalled()
  })

  it('lança BusinessError quando estado não existe', async () => {
    vi.mocked(loadStockState).mockResolvedValue(null)

    await expect(
      releaseStockCommand('var-1', { quantity: 1, order_id: ORDER_ID }),
    ).rejects.toThrow(BusinessError)
  })
})
