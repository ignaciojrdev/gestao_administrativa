import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'
import { NotFoundError } from '../../../src/helpers/errors.js'

vi.mock('../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../src/helpers/persist-event.js', () => ({
  persistEvent: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
}))
vi.mock('../../../src/helpers/load-order-state.js', () => ({ loadOpenOrder: vi.fn() }))
vi.mock('../../../src/clients/stock.client.js', () => ({
  stockClient: { release: vi.fn().mockResolvedValue(undefined) },
}))

const { removeItemCommand } = await import('../../../src/commands/remove-item.command.js')
const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { loadOpenOrder } = await import('../../../src/helpers/load-order-state.js')
const { stockClient } = await import('../../../src/clients/stock.client.js')

const stateWithItem = {
  id: 'order-1',
  status: ORDER_STATUS.OPEN,
  items: [{ id: 'item-1', variant_id: 'var-1', quantity: 2, status: 'open' }],
}

describe('removeItemCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadOpenOrder).mockResolvedValue(stateWithItem)
  })

  it('chama stockClient.release e persistEvent quando item existe', async () => {
    await removeItemCommand('order-1', 'item-1')

    expect(stockClient.release).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'var-1', quantity: 2, orderId: 'order-1' }),
    )
    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_EVENT_TYPE.ITEM_REMOVED,
        data: { item_id: 'item-1' },
      }),
      expect.any(String),
    )
  })

  it('lança NotFoundError quando item não existe no pedido', async () => {
    await expect(removeItemCommand('order-1', 'item-nao-existe')).rejects.toThrow(NotFoundError)
    expect(stockClient.release).not.toHaveBeenCalled()
    expect(persistEvent).not.toHaveBeenCalled()
  })

  it('chama release antes de persistir', async () => {
    const callOrder: string[] = []
    vi.mocked(stockClient.release).mockImplementation(async () => { callOrder.push('release') })
    vi.mocked(persistEvent).mockImplementation(async () => { callOrder.push('persist'); return { eventId: 'e' } })

    await removeItemCommand('order-1', 'item-1')

    expect(callOrder).toEqual(['release', 'persist'])
  })
})
