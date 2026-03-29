import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BusinessError } from '../../../../src/helpers/errors.js'
import { STOCK_EVENT_TYPE } from '../../../../src/constants/stock.constants.js'

vi.mock('../../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../../src/helpers/persist-event.js', () => ({ persistEvent: vi.fn() }))
vi.mock('../../../../src/helpers/load-stock-state.js', () => ({ loadStockState: vi.fn() }))

const { consumeStockCommand } = await import('../../../../src/commands/stock/consume-stock.command.js')
const { persistEvent } = await import('../../../../src/helpers/persist-event.js')
const { loadStockState } = await import('../../../../src/helpers/load-stock-state.js')

const ORDER_ID = '550e8400-e29b-41d4-a716-446655440000'

describe('consumeStockCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama persistEvent com StockConsumed quando reserva é suficiente', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 20, reserved: 5 })

    await consumeStockCommand('var-1', { quantity: 5, order_id: ORDER_ID })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STOCK_EVENT_TYPE.STOCK_CONSUMED,
        variant_id: 'var-1',
        data: { quantity: 5, order_id: ORDER_ID },
      }),
      undefined,
    )
  })

  it('lança BusinessError quando reserva é insuficiente para consumo', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 20, reserved: 3 })

    await expect(
      consumeStockCommand('var-1', { quantity: 5, order_id: ORDER_ID }),
    ).rejects.toThrow(BusinessError)

    expect(persistEvent).not.toHaveBeenCalled()
  })

  it('lança BusinessError quando estado não existe', async () => {
    vi.mocked(loadStockState).mockResolvedValue(null)

    await expect(
      consumeStockCommand('var-1', { quantity: 1, order_id: ORDER_ID }),
    ).rejects.toThrow(BusinessError)
  })

  it('passa idempotency_key para persistEvent', async () => {
    vi.mocked(loadStockState).mockResolvedValue({ variant_id: 'var-1', quantity: 20, reserved: 10 })

    await consumeStockCommand('var-1', { quantity: 5, order_id: ORDER_ID, idempotency_key: 'idem-key' })

    expect(persistEvent).toHaveBeenCalledWith(expect.anything(), 'idem-key')
  })
})
