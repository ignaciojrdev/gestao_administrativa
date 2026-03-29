import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { ORDER_EVENT_TYPE } from '../../../src/constants/order.constants.js'
import { NotFoundError, BusinessError } from '../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { loadOpenOrder } = await import('../../../src/helpers/load-order-state.js')

const orderId = 'order-1'

function makeEvent(type: string, data: object) {
  return { id: 'e1', order_id: orderId, type, data, created_at: new Date() }
}

describe('loadOpenOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna estado quando pedido está aberto', async () => {
    mocks.execute.mockResolvedValue([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
    ])

    const state = await loadOpenOrder(orderId)

    expect(state.id).toBe(orderId)
    expect(state.status).toBe('open')
  })

  it('lança NotFoundError quando não há eventos para o pedido', async () => {
    mocks.execute.mockResolvedValue([])

    await expect(loadOpenOrder(orderId)).rejects.toThrow(NotFoundError)
  })

  it('lança BusinessError quando pedido está fechado', async () => {
    mocks.execute.mockResolvedValue([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ORDER_CLOSED, { closed_at: new Date().toISOString() }),
    ])

    await expect(loadOpenOrder(orderId)).rejects.toThrow(BusinessError)
  })

  it('lança BusinessError quando pedido está cancelado', async () => {
    mocks.execute.mockResolvedValue([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ORDER_CANCELLED, {}),
    ])

    await expect(loadOpenOrder(orderId)).rejects.toThrow(BusinessError)
  })

  it('filtra eventos pelo orderId correto', async () => {
    mocks.execute.mockResolvedValue([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 2 }),
    ])

    await loadOpenOrder('order-xyz')

    expect(mocks.where).toHaveBeenCalledWith('order_id', '=', 'order-xyz')
  })
})
