import type { FastifyInstance } from 'fastify'
import { parseOrFail } from '../helpers/validate.js'
import { createProductCommand, CreateProductSchema } from '../commands/products/create-product.command.js'
import { createVariantCommand, CreateVariantSchema } from '../commands/products/create-variant.command.js'
import { deleteProductCommand } from '../commands/products/delete-product.command.js'
import { deleteVariantCommand } from '../commands/products/delete-variant.command.js'
import { getProductQuery } from '../queries/products/get-product.query.js'
import { listProductsQuery, ListProductsSchema } from '../queries/products/list-products.query.js'
import { db } from '../db.js'
import { t } from '../i18n/index.js'

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

  app.get<{ Params: { variantId: string } }>('/products/variants/:variantId', async (request, reply) => {
    const variant = await db
      .selectFrom('product_variants')
      .select(['id', 'name', 'sku', 'price'])
      .where('id', '=', request.params.variantId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!variant) {
      return reply.status(404).send({ error: t('errors.variant_not_found', { id: request.params.variantId }) })
    }

    return reply.send(variant)
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

  app.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    await deleteProductCommand(request.params.id)
    return reply.status(204).send()
  })

  app.delete<{ Params: { id: string; variantId: string } }>(
    '/products/:id/variants/:variantId',
    async (request, reply) => {
      await deleteVariantCommand(request.params.id, request.params.variantId)
      return reply.status(204).send()
    },
  )
}
