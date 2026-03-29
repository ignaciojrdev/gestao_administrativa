import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'

vi.mock('../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../src/helpers/persist-event.js', () => ({
  persistEvent: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
}))
vi.mock('../../../src/helpers/load-order-state.js', () => ({ loadOpenOrder: vi.fn() }))
vi.mock('../../../src/clients/stock.client.js', () => ({
  stockClient: { release: vi.fn().mockResolvedValue(undefined) },
}))

const { cancelOrderCommand } = await import('../../../src/commands/cancel-order.command.js')
const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { loadOpenOrder } = await import('../../../src/helpers/load-order-state.js')
const { stockClient } = await import('../../../src/clients/stock.client.js')

describe('cancelOrderCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('libera estoque de cada item e persiste OrderCancelled', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1',
      status: ORDER_STATUS.OPEN,
      items: [
        { id: 'item-1', variant_id: 'var-1', quantity: 2, status: 'open' },
        { id: 'item-2', variant_id: 'var-2', quantity: 1, status: 'open' },
      ],
    })

    await cancelOrderCommand('order-1', { reason: 'cliente desistiu' })

    expect(stockClient.release).toHaveBeenCalledTimes(2)
    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_EVENT_TYPE.ORDER_CANCELLED,
        data: { reason: 'cliente desistiu' },
      }),
      expect.any(String),
    )
  })

  it('não chama stockClient.release quando pedido não tem itens', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1', status: ORDER_STATUS.OPEN, items: [],
    })

    await cancelOrderCommand('order-1')

    expect(stockClient.release).not.toHaveBeenCalled()
    expect(persistEvent).toHaveBeenCalled()
  })

  it('persiste cancelamento sem motivo quando reason não fornecido', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1', status: ORDER_STATUS.OPEN, items: [],
    })

    await cancelOrderCommand('order-1')

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reason: undefined } }),
      expect.any(String),
    )
  })
})
