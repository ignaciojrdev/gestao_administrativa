import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'
import { NotFoundError } from '../../../../src/helpers/errors.js'
import { STOCK_EVENT_TYPE } from '../../../../src/constants/stock.constants.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))
vi.mock('../../../../src/helpers/persist-event.js', () => ({ persistEvent: vi.fn() }))

const { stockInCommand } = await import('../../../../src/commands/stock/stock-in.command.js')
const { persistEvent } = await import('../../../../src/helpers/persist-event.js')

describe('stockInCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama persistEvent com evento StockIn quando variante existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue({ id: 'var-1' })

    await stockInCommand('var-1', { quantity: 20, reason: 'purchase' })

    expect(persistEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: STOCK_EVENT_TYPE.STOCK_IN,
        variant_id: 'var-1',
        data: { quantity: 20, reason: 'purchase' },
      }),
      undefined,
    )
  })

  it('lança NotFoundError quando variante não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(stockInCommand('nao-existe', { quantity: 10, reason: 'purchase' })).rejects.toThrow(
      NotFoundError,
    )
  })

  it('não chama persistEvent quando variante não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(stockInCommand('nao-existe', { quantity: 5, reason: 'return' })).rejects.toThrow()
    expect(persistEvent).not.toHaveBeenCalled()
  })
})
