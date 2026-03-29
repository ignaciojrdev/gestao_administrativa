import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { applyEventToProjection } from '../../../src/projections/stock.projection.js'
import { STOCK_EVENT_TYPE } from '../../../src/constants/stock.constants.js'
import type { DomainEvent } from '../../../src/domain/events.js'

describe('applyEventToProjection', () => {
  let db: ReturnType<typeof createDbMock>['db']
  let mocks: ReturnType<typeof createDbMock>['mocks']

  beforeEach(() => {
    const result = createDbMock()
    db = result.db
    mocks = result.mocks
    vi.clearAllMocks()
  })

  it('StockIn — faz upsert com quantity e reserved=0 na criação', async () => {
    const event: DomainEvent = {
      type: STOCK_EVENT_TYPE.STOCK_IN,
      variant_id: 'var-1',
      data: { quantity: 50, reason: 'purchase' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.insertInto).toHaveBeenCalledWith('stock_projection')
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ variant_id: 'var-1', quantity: 50, reserved: 0 }),
    )
    expect(mocks.onConflict).toHaveBeenCalled()
  })

  it('StockOut — atualiza quantity com decremento', async () => {
    const event: DomainEvent = {
      type: STOCK_EVENT_TYPE.STOCK_OUT,
      variant_id: 'var-1',
      data: { quantity: 10, reason: 'manual' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('stock_projection')
    expect(mocks.set).toHaveBeenCalled()
    expect(mocks.updateWhere).toHaveBeenCalledWith('variant_id', '=', 'var-1')
  })

  it('StockReserved — atualiza reserved com incremento', async () => {
    const event: DomainEvent = {
      type: STOCK_EVENT_TYPE.STOCK_RESERVED,
      variant_id: 'var-1',
      data: { quantity: 5, order_id: 'order-1' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('stock_projection')
    expect(mocks.updateWhere).toHaveBeenCalledWith('variant_id', '=', 'var-1')
  })

  it('StockReleased — atualiza reserved com decremento', async () => {
    const event: DomainEvent = {
      type: STOCK_EVENT_TYPE.STOCK_RELEASED,
      variant_id: 'var-1',
      data: { quantity: 5, order_id: 'order-1' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('stock_projection')
  })

  it('StockConsumed — atualiza quantity e reserved com decremento', async () => {
    const event: DomainEvent = {
      type: STOCK_EVENT_TYPE.STOCK_CONSUMED,
      variant_id: 'var-1',
      data: { quantity: 5, order_id: 'order-1' },
    }

    await applyEventToProjection(db as any, event)

    expect(db.updateTable).toHaveBeenCalledWith('stock_projection')
    expect(mocks.updateWhere).toHaveBeenCalledWith('variant_id', '=', 'var-1')
  })
})
