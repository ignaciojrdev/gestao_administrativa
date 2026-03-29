import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'
import { BusinessError } from '../../../src/helpers/errors.js'

vi.mock('../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../src/helpers/persist-event.js', () => ({
  persistEvent: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
}))
vi.mock('../../../src/helpers/load-order-state.js', () => ({ loadOpenOrder: vi.fn() }))
vi.mock('../../../src/clients/stock.client.js', () => ({
  stockClient: { reserve: vi.fn().mockResolvedValue(undefined) },
}))

const { addItemCommand } = await import('../../../src/commands/add-item.command.js')
const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { loadOpenOrder } = await import('../../../src/helpers/load-order-state.js')
const { stockClient } = await import('../../../src/clients/stock.client.js')

const VARIANT_ID = '550e8400-e29b-41d4-a716-446655440000'

describe('addItemCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadOpenOrder).mockResolvedValue({
      id: 'order-1', status: ORDER_STATUS.OPEN, items: [],
    })
  })

  it('retorna item_id gerado', async () => {
    const result = await addItemCommand('order-1', { variant_id: VARIANT_ID, quantity: 2 })

    expect(result.item_id).toBeTypeOf('string')
    expect(result.item_id).toHaveLength(36)
  })

  it('chama stockClient.reserve antes de persistir', async () => {
    const callOrder: string[] = []
    vi.mocked(stockClient.reserve).mockImplementation(async () => { callOrder.push('reserve') })
    vi.mocked(persistEvent).mockImplementation(async () => { callOrder.push('persist'); return { eventId: 'e' } })

    await addItemCommand('order-1', { variant_id: VARIANT_ID, quantity: 3 })

    expect(callOrder).toEqual(['reserve', 'persist'])
  })

  it('passa orderId e idempotencyKey para stockClient.reserve', async () => {
    await addItemCommand('order-1', { variant_id: VARIANT_ID, quantity: 2 })

    expect(stockClient.reserve).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: VARIANT_ID,
        quantity: 2,
        orderId: 'order-1',
        idempotencyKey: expect.any(String),
      }),
    )
  })

  it('chama persistEvent com evento ItemAdded', async () => {
    await addItemCommand('order-1', { variant_id: VARIANT_ID, quantity: 1 })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_EVENT_TYPE.ITEM_ADDED,
        order_id: 'order-1',
        data: expect.objectContaining({ variant_id: VARIANT_ID, quantity: 1 }),
      }),
      expect.any(String),
    )
  })

  it('não chama persistEvent quando stockClient.reserve falha', async () => {
    vi.mocked(stockClient.reserve).mockRejectedValue(new BusinessError('Estoque insuficiente'))

    await expect(addItemCommand('order-1', { variant_id: VARIANT_ID, quantity: 99 })).rejects.toThrow(BusinessError)
    expect(persistEvent).not.toHaveBeenCalled()
  })
})
