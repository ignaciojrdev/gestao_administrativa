import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { deleteVariantCommand } = await import('../../../../src/commands/products/delete-variant.command.js')
const { NotFoundError } = await import('../../../../src/helpers/errors.js')

describe('deleteVariantCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lança NotFoundError quando variante não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(deleteVariantCommand('prod-1', 'var-inexistente')).rejects.toThrow(NotFoundError)
  })

  it('faz soft delete na variante quando ela existe', async () => {
    mocks.executeTakeFirst.mockResolvedValue({ id: 'var-1' })

    await deleteVariantCommand('prod-1', 'var-1')

    expect(mocks.updateTable).toHaveBeenCalledWith('product_variants')
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(Date) }),
    )
    expect(mocks.updateExecute).toHaveBeenCalled()
  })

  it('não faz update quando variante não é encontrada', async () => {
    mocks.executeTakeFirst.mockResolvedValue(undefined)

    await expect(deleteVariantCommand('prod-1', 'var-x')).rejects.toThrow()
    expect(mocks.updateTable).not.toHaveBeenCalled()
  })
})
