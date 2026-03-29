import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDbMock } from '../../../helpers/db-mock.js'

const { db, mocks } = createDbMock()
vi.mock('../../../../src/db.js', () => ({ db }))

const { createProductCommand } = await import('../../../../src/commands/products/create-product.command.js')

describe('createProductCommand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('insere produto e retorna id gerado', async () => {
    const result = await createProductCommand({ name: 'X-Burguer', description: 'Clássico' })

    expect(result.id).toBeTypeOf('string')
    expect(result.id).toHaveLength(36) // UUID
    expect(mocks.insertExecute).toHaveBeenCalled()
  })

  it('insere produto sem description (null)', async () => {
    await createProductCommand({ name: 'Fritas' })

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fritas', description: null }),
    )
  })

  it('retorna ids únicos para cada chamada', async () => {
    const r1 = await createProductCommand({ name: 'Produto A' })
    const r2 = await createProductCommand({ name: 'Produto B' })

    expect(r1.id).not.toBe(r2.id)
  })
})
