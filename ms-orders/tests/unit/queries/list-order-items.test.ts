import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'
import { NotFoundError } from '../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { listOrderItemsQuery } = await import('../../../src/queries/list-order-items.query.js')

const mockItems = [
  { id: 'item-1', variant_id: 'var-1', quantity: 2, unit_price: 10, status: 'open', created_at: new Date() },
  { id: 'item-2', variant_id: 'var-2', quantity: 1, unit_price: 25, status: 'open', created_at: new Date() },
]

describe('listOrderItemsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Pedido existe por padrão
    mocks.executeTakeFirst.mockResolvedValue({ id: 'order-1' })
    mocks.execute.mockResolvedValue(mockItems)
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 2 })
  })

  it('retorna lista com total e metadados de paginação', async () => {
    const result = await listOrderItemsQuery('order-1', { page: 1, limit: 20 })

    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('calcula offset correto para página 1', async () => {
    await listOrderItemsQuery('order-1', { page: 1, limit: 20 })

    expect(mocks.offset).toHaveBeenCalledWith(0)
  })

  it('calcula offset correto para página 2', async () => {
    await listOrderItemsQuery('order-1', { page: 2, limit: 10 })

    expect(mocks.offset).toHaveBeenCalledWith(10)
  })

  it('calcula offset correto para página 3 com limit 5', async () => {
    await listOrderItemsQuery('order-1', { page: 3, limit: 5 })

    expect(mocks.offset).toHaveBeenCalledWith(10)
  })

  it('aplica limit correto na consulta', async () => {
    await listOrderItemsQuery('order-1', { page: 1, limit: 15 })

    expect(mocks.limit).toHaveBeenCalledWith(15)
  })

  it('lança NotFoundError quando pedido não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(
      listOrderItemsQuery('pedido-inexistente', { page: 1, limit: 20 }),
    ).rejects.toThrow(NotFoundError)
  })

  it('mensagem de NotFoundError contém o id do pedido', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(
      listOrderItemsQuery('pedido-xyz', { page: 1, limit: 20 }),
    ).rejects.toThrow(/pedido-xyz/)
  })

  it('converte total para número', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: '7' })

    const result = await listOrderItemsQuery('order-1', { page: 1, limit: 20 })

    expect(result.total).toBe(7)
    expect(typeof result.total).toBe('number')
  })

  it('filtra itens pelo order_id correto', async () => {
    await listOrderItemsQuery('order-abc', { page: 1, limit: 20 })

    expect(mocks.where).toHaveBeenCalledWith('id', '=', 'order-abc')
    expect(mocks.where).toHaveBeenCalledWith('order_id', '=', 'order-abc')
  })
})
