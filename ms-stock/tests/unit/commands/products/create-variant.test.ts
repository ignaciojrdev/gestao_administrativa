import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'
import { NotFoundError, ConflictError } from '../../../../src/helpers/errors.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { createVariantCommand } = await import('../../../../src/commands/products/create-variant.command.js')

describe('createVariantCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria variante e retorna id quando produto existe e sku é único', async () => {
    // 1ª chamada: produto existe / 2ª: SKU não existe
    mocks.executeTakeFirst
      .mockResolvedValueOnce({ id: 'prod-1' })
      .mockResolvedValueOnce(undefined)

    const result = await createVariantCommand('prod-1', { name: 'P/ Queijo', sku: 'SKU-001' })

    expect(result.id).toBeTypeOf('string')
    expect(mocks.insertExecute).toHaveBeenCalled()
  })

  it('lança NotFoundError quando produto não existe', async () => {
    mocks.executeTakeFirst.mockResolvedValueOnce(undefined)

    await expect(
      createVariantCommand('nao-existe', { name: 'Variante', sku: 'SKU-X' }),
    ).rejects.toThrow(NotFoundError)
  })

  it('lança ConflictError quando SKU já está em uso', async () => {
    mocks.executeTakeFirst
      .mockResolvedValueOnce({ id: 'prod-1' })     // produto existe
      .mockResolvedValueOnce({ id: 'var-outro' })   // SKU já existe

    await expect(
      createVariantCommand('prod-1', { name: 'Duplicado', sku: 'SKU-EXISTENTE' }),
    ).rejects.toThrow(ConflictError)

    expect(mocks.insertExecute).not.toHaveBeenCalled()
  })
})
