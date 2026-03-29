import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { ORDER_EVENT_TYPE } from '../../../src/constants/order.constants.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))
vi.mock('../../../src/projections/order.projection.js', () => ({
  applyEventToProjection: vi.fn().mockResolvedValue(undefined),
}))

const { persistEvent } = await import('../../../src/helpers/persist-event.js')
const { applyEventToProjection } = await import('../../../src/projections/order.projection.js')

const baseEvent = {
  type: ORDER_EVENT_TYPE.ORDER_CREATED,
  order_id: 'order-1',
  data: { table_number: 1 },
}

describe('persistEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna eventId gerado automaticamente quando não fornecido', async () => {
    const result = await persistEvent(baseEvent)

    expect(result.eventId).toBeTypeOf('string')
    expect(result.eventId).toHaveLength(36) // UUID v4
  })

  it('usa o eventId fornecido quando passado explicitamente', async () => {
    const result = await persistEvent(baseEvent, 'meu-event-id')

    expect(result.eventId).toBe('meu-event-id')
  })

  it('insere o evento com os dados corretos', async () => {
    await persistEvent(baseEvent, 'evt-123')

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-123',
        order_id: 'order-1',
        type: ORDER_EVENT_TYPE.ORDER_CREATED,
      }),
    )
  })

  it('chama applyEventToProjection com o evento correto', async () => {
    await persistEvent(baseEvent)

    expect(applyEventToProjection).toHaveBeenCalledWith(expect.anything(), baseEvent)
  })

  it('executa insert e projeção dentro de uma transação', async () => {
    await persistEvent(baseEvent)

    expect(mocks.transaction).toHaveBeenCalled()
  })
})
