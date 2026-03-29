import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { NotFoundError } from '../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { getOrderQuery } = await import('../../../src/queries/get-order.query.js')

const mockOrder = { id: 'order-1', status: 'open', created_at: new Date(), updated_at: new Date() }
const mockItems = [{ id: 'item-1', variant_id: 'var-1', quantity: 2, status: 'open', created_at: new Date() }]

describe('getOrderQuery', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna pedido com itens quando encontrado', async () => {
    mocks.executeTakeFirst.mockResolvedValue(mockOrder)
    mocks.execute.mockResolvedValue(mockItems)

    const result = await getOrderQuery('order-1')

    expect(result).toMatchObject({ id: 'order-1', status: 'open' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ id: 'item-1' })
  })

  it('lança NotFoundError quando pedido não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(getOrderQuery('nao-existe')).rejects.toThrow(NotFoundError)
  })

  it('retorna pedido com lista vazia quando não há itens', async () => {
    mocks.executeTakeFirst.mockResolvedValue(mockOrder)
    mocks.execute.mockResolvedValue([])

    const result = await getOrderQuery('order-1')

    expect(result.items).toEqual([])
  })

  it('filtra itens pelo order_id correto', async () => {
    mocks.executeTakeFirst.mockResolvedValue(mockOrder)
    mocks.execute.mockResolvedValue([])

    await getOrderQuery('order-xyz')

    expect(mocks.where).toHaveBeenCalledWith('order_id', '=', 'order-xyz')
  })
})
