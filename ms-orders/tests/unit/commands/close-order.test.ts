import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'
import { BusinessError } from '../../../src/helpers/errors.js'

vi.mock('../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../src/helpers/persist-event.js', () => ({
  persistEvent: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
}))
vi.mock('../../../src/helpers/load-order-state.js', () => ({ loadOpenOrder: vi.fn() }))
vi.mock('../../../src/clients/stock.client.js', () => ({
  stockClient: { consume: vi.fn().mockResolvedValue(undefined) },
}))

const { closeOrderCommand } = await import('../../../src/commands/close-order.command.js')
const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { loadOpenOrder } = await import('../../../src/helpers/load-order-state.js')
const { stockClient } = await import('../../../src/clients/stock.client.js')

describe('closeOrderCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama stockClient.consume para cada item e persiste OrderClosed', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1',
      status: ORDER_STATUS.OPEN,
      items: [
        { id: 'item-1', variant_id: 'var-1', quantity: 2, status: 'open' },
        { id: 'item-2', variant_id: 'var-2', quantity: 1, status: 'open' },
      ],
    })

    await closeOrderCommand('order-1')

    expect(stockClient.consume).toHaveBeenCalledTimes(2)
    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: ORDER_EVENT_TYPE.ORDER_CLOSED }),
      expect.any(String),
    )
  })

  it('usa idempotencyKey único por item (eventId-itemId)', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1',
      status: ORDER_STATUS.OPEN,
      items: [{ id: 'item-1', variant_id: 'var-1', quantity: 3, status: 'open' }],
    })

    await closeOrderCommand('order-1')

    expect(stockClient.consume).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/-item-1$/),
      }),
    )
  })

  it('lança BusinessError quando pedido não tem itens', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1', status: ORDER_STATUS.OPEN, items: [],
    })

    await expect(closeOrderCommand('order-1')).rejects.toThrow(BusinessError)
    expect(stockClient.consume).not.toHaveBeenCalled()
    expect(persistEvent).not.toHaveBeenCalled()
  })

  it('não persiste quando stockClient.consume falha', async () => {
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1',
      status: ORDER_STATUS.OPEN,
      items: [{ id: 'item-1', variant_id: 'var-1', quantity: 1, status: 'open' }],
    })
    vi.mocked(stockClient.consume).mockRejectedValue(new BusinessError('Reserva insuficiente'))

    await expect(closeOrderCommand('order-1')).rejects.toThrow()
    expect(persistEvent).not.toHaveBeenCalled()
  })
})
