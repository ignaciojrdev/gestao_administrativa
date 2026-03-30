import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { deleteProductCommand } = await import('../../../../src/commands/products/delete-product.command.js')
const { NotFoundError } = await import('../../../../src/helpers/errors.js')

describe('deleteProductCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lança NotFoundError quando produto não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(deleteProductCommand('prod-inexistente')).rejects.toThrow(NotFoundError)
  })

  it('faz soft delete no produto quando ele existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue({ id: 'prod-1' })

    await deleteProductCommand('prod-1')

    expect(mocks.updateTable).toHaveBeenCalledWith('products')
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(Date) }),
    )
  })

  it('faz soft delete nas variantes do produto', async () => {
    mocks.executeTakeFirst.mockResolvedValue({ id: 'prod-1' })

    await deleteProductCommand('prod-1')

    expect(mocks.updateTable).toHaveBeenCalledWith('product_variants')
  })

  it('chama updateTable duas vezes (produto + variantes)', async () => {
    mocks.executeTakeFirst.mockResolvedValue({ id: 'prod-1' })

    await deleteProductCommand('prod-1')

    expect(mocks.updateTable).toHaveBeenCalledTimes(2)
    expect(mocks.updateExecute).toHaveBeenCalledTimes(2)
  })
})
