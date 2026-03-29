import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { STOCK_EVENT_TYPE } from '../../../src/constants/stock.constants.js'
import { ConflictError } from '../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))
vi.mock('../../../src/projections/stock.projection.js', () => ({
  applyEventToProjection: vi.fn().mockResolvedValue(undefined),
}))

const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { applyEventToProjection } = await import('../../../src/projections/stock.projection.js')

const baseEvent = {
  type: STOCK_EVENT_TYPE.STOCK_IN,
  variant_id: 'var-1',
  data: { quantity: 10, reason: 'purchase' as const },
}

describe('persistEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('persiste o evento e chama applyEventToProjection', async () => {
    await persistEvent(baseEvent)

    expect(mocks.insertExecute).toHaveBeenCalled()
    expect(applyEventToProjection).toHaveBeenCalledWith(
      expect.anything(),
      baseEvent,
    )
  })

  it('com idempotencyKey verifica processed_events antes de persistir', async () => {
    mocks.executeTakeFirst.mockResolvedValueOnce(undefined) // não processado

    await persistEvent(baseEvent, 'idem-key-123')

    expect(mocks.where).toHaveBeenCalledWith('event_id', '=', 'idem-key-123')
  })

  it('lança ConflictError quando evento já foi processado', async () => {
    mocks.executeTakeFirst.mockResolvedValueOnce({ event_id: 'idem-key-123' }) // já processado

    await expect(persistEvent(baseEvent, 'idem-key-123')).rejects.toThrow(ConflictError)
  })

  it('sem idempotencyKey não consulta processed_events', async () => {
    await persistEvent(baseEvent)

    // selectFrom chamado apenas para stock_events insert (via transaction), não para processed_events
    expect(mocks.executeTakeFirst).not.toHaveBeenCalled()
  })
})
