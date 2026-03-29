import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORDER_EVENT_TYPE } from '../../../src/constants/order.constants.js'

vi.mock('../../../src/db.js', () => ({ db: {} }))
vi.mock('../../../src/helpers/persist-event.js', () => ({
  persistEvent: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
}))

const { createOrderCommand } = await import('../../../src/commands/create-order.command.js')
const { persistEvent } = await import('../../../src/helpers/persist-event.js')

describe('createOrderCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna id de pedido gerado', async () => {
    const result = await createOrderCommand({ table_number: 5 })

    expect(result.id).toBeTypeOf('string')
    expect(result.id).toHaveLength(36)
  })

  it('chama persistEvent com evento OrderCreated', async () => {
    await createOrderCommand({ table_number: 3 })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_EVENT_TYPE.ORDER_CREATED,
        data: { table_number: 3 },
      }),
      expect.any(String),
    )
  })

  it('gera ids únicos para cada pedido', async () => {
    const r1 = await createOrderCommand({ table_number: 1 })
    const r2 = await createOrderCommand({ table_number: 2 })

    expect(r1.id).not.toBe(r2.id)
  })
})
