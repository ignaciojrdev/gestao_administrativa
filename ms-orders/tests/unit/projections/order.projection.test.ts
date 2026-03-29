import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { applyEventToProjection } from '../../../src/projections/order.projection.js'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'
import type { DomainEvent } from '../../../src/domain/events.js'

describe('applyEventToProjection', () => {
  let db: ReturnType<typeof createDbMock>['db']
  let mocks: ReturnType<typeof createDbMock>['mocks']

  beforeEach(() => {
    const result = createDbMock()
    db = result.db
    mocks = result.mocks
  })

  it('OrderCreated — insere pedido com status open', async () => {
    const event: DomainEvent = {
      type: ORDER_EVENT_TYPE.ORDER_CREATED,
      order_id: 'order-1',
      data: { table_number: 3 },
    }

    await applyEventToProjection(db as any, event)

    expect(db.insertInto).toHaveBeenCalledWith('orders')
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1', status: ORDER_STATUS.OPEN }),
    )
  })

  it('ItemAdded — insere item com dados corretos', async () => {
    const event: DomainEvent = {
      type: ORDER_EVENT_TYPE.ITEM_ADDED,
      order_id: 'order-1',
      data: { item_id: 'item-1', variant_id: 'var-1', quantity: 2 },
    }

    await applyEventToProjection(db as any, event)

    expect(db.insertInto).toHaveBeenCalledWith('order_items')
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        order_id: 'order-1',
        variant_id: 'var-1',
        quantity: 2,
      }),
    )
  })

  it('ItemRemoved — remove item pelo id e order_id', async () => {
    const event: DomainEvent = {
      type: ORDER_EVENT_TYPE.ITEM_REMOVED,
      order_id: 'order-1',
      data: { item_id: 'item-1' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.deleteFrom).toHaveBeenCalledWith('order_items')
    expect(mocks.deleteWhere).toHaveBeenCalledWith('id', '=', 'item-1')
  })

  it('OrderClosed — atualiza status para closed', async () => {
    const event: DomainEvent = {
      type: ORDER_EVENT_TYPE.ORDER_CLOSED,
      order_id: 'order-1',
      data: { closed_at: new Date().toISOString() },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('orders')
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CLOSED }),
    )
    expect(mocks.updateWhere).toHaveBeenCalledWith('id', '=', 'order-1')
  })

  it('OrderCancelled — atualiza status para cancelled', async () => {
    const event: DomainEvent = {
      type: ORDER_EVENT_TYPE.ORDER_CANCELLED,
      order_id: 'order-1',
      data: { reason: 'cliente desistiu' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('orders')
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    )
  })
})
