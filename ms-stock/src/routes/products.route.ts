import type { FastifyInstance } from 'fastify'
import { parseOrFail } from '../helpers/validate.js'
import { createProductCommand, CreateProductSchema } from '../commands/products/create-product.command.js'
import { createVariantCommand, CreateVariantSchema } from '../commands/products/create-variant.command.js'
import { getProductQuery } from '../queries/products/get-product.query.js'
import { listProductsQuery, ListProductsSchema } from '../queries/products/list-products.query.js'

export async function productsRoute(app: FastifyInstance): Promise<void> {
  // ─── Queries ──────────────────────────────────────────────────────────────

  app.get('/products', async (request, reply) => {
    const input = parseOrFail(ListProductsSchema, request.query, reply)
    if (!input) return

    return reply.send(await listProductsQuery(input))
  })

  app.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    return reply.send(await getProductQuery(request.params.id))
  })

  // ─── Commands ─────────────────────────────────────────────────────────────

  app.post('/products', async (request, reply) => {
    const body = parseOrFail(CreateProductSchema, request.body, reply)
    if (!body) return

    return reply.status(201).send(await createProductCommand(body))
  })

  app.post<{ Params: { id: string } }>('/products/:id/variants', async (request, reply) => {
    const body = parseOrFail(CreateVariantSchema, request.body, reply)
    if (!body) return

    return reply.status(201).send(await createVariantCommand(request.params.id, body))
  })
}
