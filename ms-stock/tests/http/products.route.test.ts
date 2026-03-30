import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

vi.mock('../../src/db.js', () => ({ db: {} }))

// ─── Mocks de commands (mantém schemas reais para testar validação) ───────────

vi.mock('../../src/commands/products/create-product.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/products/create-product.command.js')>()
  return { ...mod, createProductCommand: vi.fn() }
})

vi.mock('../../src/commands/products/create-variant.command.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/commands/products/create-variant.command.js')>()
  return { ...mod, createVariantCommand: vi.fn() }
})

vi.mock('../../src/commands/products/delete-product.command.js', () => ({
  deleteProductCommand: vi.fn(),
}))

vi.mock('../../src/commands/products/delete-variant.command.js', () => ({
  deleteVariantCommand: vi.fn(),
}))

// ─── Mocks de queries ─────────────────────────────────────────────────────────

vi.mock('../../src/queries/products/get-product.query.js', () => ({
  getProductQuery: vi.fn(),
}))

vi.mock('../../src/queries/products/list-products.query.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/queries/products/list-products.query.js')>()
  return { ...mod, listProductsQuery: vi.fn() }
})

// ─── Imports após mocks ───────────────────────────────────────────────────────

const { buildApp } = await import('../../src/app.js')
const { createProductCommand } = await import('../../src/commands/products/create-product.command.js')
const { createVariantCommand } = await import('../../src/commands/products/create-variant.command.js')
const { deleteProductCommand } = await import('../../src/commands/products/delete-product.command.js')
const { deleteVariantCommand } = await import('../../src/commands/products/delete-variant.command.js')
const { getProductQuery } = await import('../../src/queries/products/get-product.query.js')
const { listProductsQuery } = await import('../../src/queries/products/list-products.query.js')
const { NotFoundError, ConflictError } = await import('../../src/helpers/errors.js')

// ─── Setup ────────────────────────────────────────────────────────────────────

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = buildApp()
  await app.ready()
})

// ─── POST /products ───────────────────────────────────────────────────────────

describe('POST /products', () => {
  it('retorna 201 com id quando body é válido', async () => {
    vi.mocked(createProductCommand).mockResolvedValue({ id: 'prod-uuid' })

    const res = await app.inject({
      method: 'POST',
      url: '/products',
      payload: { name: 'Hambúrguer', description: 'Clássico' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ id: 'prod-uuid' })
  })

  it('retorna 201 sem description (campo opcional)', async () => {
    vi.mocked(createProductCommand).mockResolvedValue({ id: 'prod-uuid' })

    const res = await app.inject({ method: 'POST', url: '/products', payload: { name: 'Fritas' } })

    expect(res.statusCode).toBe(201)
  })

  it('retorna 400 quando name está ausente', async () => {
    const res = await app.inject({ method: 'POST', url: '/products', payload: {} })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando name é string vazia', async () => {
    const res = await app.inject({ method: 'POST', url: '/products', payload: { name: '' } })
    expect(res.statusCode).toBe(400)
  })
})

// ─── GET /products ────────────────────────────────────────────────────────────

describe('GET /products', () => {
  it('retorna 200 com lista paginada', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 }
    vi.mocked(listProductsQuery).mockResolvedValue(mockResult)

    const res = await app.inject({ method: 'GET', url: '/products' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(mockResult)
  })

  it('passa parâmetro search para a query', async () => {
    vi.mocked(listProductsQuery).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

    await app.inject({ method: 'GET', url: '/products?search=hamburguer' })

    expect(listProductsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'hamburguer' }),
    )
  })
})

// ─── GET /products/:id ────────────────────────────────────────────────────────

describe('GET /products/:id', () => {
  it('retorna 200 com produto e variantes', async () => {
    const mockProduct = { id: 'prod-1', name: 'X-Burguer', description: null, variants: [] }
    vi.mocked(getProductQuery).mockResolvedValue(mockProduct as any)

    const res = await app.inject({ method: 'GET', url: '/products/prod-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: 'prod-1', name: 'X-Burguer' })
  })

  it('retorna 404 quando produto não existe', async () => {
    vi.mocked(getProductQuery).mockRejectedValue(new NotFoundError('Produto não encontrado'))

    const res = await app.inject({ method: 'GET', url: '/products/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})

// ─── POST /products/:id/variants ──────────────────────────────────────────────

describe('POST /products/:id/variants', () => {
  const validBody = { name: 'P/ Queijo', sku: 'XB-QJ-001' }

  it('retorna 201 com id quando body é válido', async () => {
    vi.mocked(createVariantCommand).mockResolvedValue({ id: 'var-uuid' })

    const res = await app.inject({
      method: 'POST',
      url: '/products/prod-1/variants',
      payload: validBody,
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ id: 'var-uuid' })
  })

  it('retorna 400 quando sku está ausente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/products/prod-1/variants',
      payload: { name: 'Sem SKU' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 404 quando produto não existe', async () => {
    vi.mocked(createVariantCommand).mockRejectedValue(new NotFoundError('Produto não encontrado'))

    const res = await app.inject({
      method: 'POST',
      url: '/products/nao-existe/variants',
      payload: validBody,
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 quando SKU já existe', async () => {
    vi.mocked(createVariantCommand).mockRejectedValue(new ConflictError('SKU já em uso'))

    const res = await app.inject({
      method: 'POST',
      url: '/products/prod-1/variants',
      payload: validBody,
    })

    expect(res.statusCode).toBe(409)
  })
})

// ─── DELETE /products/:id ────────────────────────────────────────────────────

describe('DELETE /products/:id', () => {
  it('retorna 204 quando produto é deletado com sucesso', async () => {
    vi.mocked(deleteProductCommand).mockResolvedValue(undefined)

    const res = await app.inject({ method: 'DELETE', url: '/products/prod-1' })

    expect(res.statusCode).toBe(204)
    expect(deleteProductCommand).toHaveBeenCalledWith('prod-1')
  })

  it('retorna 404 quando produto não existe', async () => {
    vi.mocked(deleteProductCommand).mockRejectedValue(new NotFoundError('Produto não encontrado'))

    const res = await app.inject({ method: 'DELETE', url: '/products/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})

// ─── DELETE /products/:id/variants/:variantId ────────────────────────────────

describe('DELETE /products/:id/variants/:variantId', () => {
  it('retorna 204 quando variante é deletada com sucesso', async () => {
    vi.mocked(deleteVariantCommand).mockResolvedValue(undefined)

    const res = await app.inject({ method: 'DELETE', url: '/products/prod-1/variants/var-1' })

    expect(res.statusCode).toBe(204)
    expect(deleteVariantCommand).toHaveBeenCalledWith('prod-1', 'var-1')
  })

  it('retorna 404 quando variante não existe', async () => {
    vi.mocked(deleteVariantCommand).mockRejectedValue(new NotFoundError('Variante não encontrada'))

    const res = await app.inject({ method: 'DELETE', url: '/products/prod-1/variants/nao-existe' })

    expect(res.statusCode).toBe(404)
  })
})
