import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../helpers/db-mock.js'

const { db, mocks } = createDbMock()
vi.mock('../../../src/db.js', () => ({ db }))

const { listOrdersQuery } = await import('../../../src/queries/list-orders.query.js')

const mockOrders = [
  { id: 'order-1', status: 'open', created_at: new Date(), updated_at: new Date() },
  { id: 'order-2', status: 'closed', created_at: new Date(), updated_at: new Date() },
]

describe('listOrdersQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.execute.mockResolvedValue(mockOrders)
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: 2 })
  })

  it('retorna lista com total e metadados de paginação', async () => {
    const result = await listOrdersQuery({ page: 1, limit: 20 })

    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('aplica filtro de status quando fornecido', async () => {
    await listOrdersQuery({ page: 1, limit: 20, status: 'open' })

    expect(mocks.where).toHaveBeenCalledWith('status', '=', 'open')
  })

  it('não aplica filtro de status quando não fornecido', async () => {
    await listOrdersQuery({ page: 1, limit: 20 })

    expect(mocks.where).not.toHaveBeenCalledWith('status', '=', expect.anything())
  })

  it('calcula offset correto para página 2', async () => {
    await listOrdersQuery({ page: 2, limit: 10 })

    expect(mocks.offset).toHaveBeenCalledWith(10)
  })

  it('converte total para número', async () => {
    mocks.executeTakeFirstOrThrow.mockResolvedValue({ total: '42' })

    const result = await listOrdersQuery({ page: 1, limit: 20 })

    expect(result.total).toBe(42)
    expect(typeof result.total).toBe('number')
  })
})
