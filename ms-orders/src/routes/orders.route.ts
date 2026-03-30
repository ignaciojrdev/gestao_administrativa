import type { FastifyInstance } from 'fastify'
import { parseOrFail } from '../helpers/validate.js'
import { createOrderCommand, CreateOrderSchema } from '../commands/create-order.command.js'
import { addItemCommand, AddItemSchema } from '../commands/add-item.command.js'
import { removeItemCommand } from '../commands/remove-item.command.js'
import { closeOrderCommand } from '../commands/close-order.command.js'
import { cancelOrderCommand, CancelOrderSchema } from '../commands/cancel-order.command.js'
import { getOrderQuery } from '../queries/get-order.query.js'
import { listOrdersQuery, ListOrdersSchema } from '../queries/list-orders.query.js'
import { listOrderItemsQuery, ListOrderItemsSchema } from '../queries/list-order-items.query.js'

export async function ordersRoute(app: FastifyInstance): Promise<void> {
  // ─── Queries ──────────────────────────────────────────────────────────────

  app.get('/orders', async (request, reply) => {
    const input = parseOrFail(ListOrdersSchema, request.query, reply)
    if (!input) return

    return reply.send(await listOrdersQuery(input))
  })

  app.get<{ Params: { id: string } }>('/orders/:id', async (request, reply) => {
    return reply.send(await getOrderQuery(request.params.id))
  })

  app.get<{ Params: { id: string } }>('/orders/:id/items', async (request, reply) => {
    const input = parseOrFail(ListOrderItemsSchema, request.query, reply)
    if (!input) return

    return reply.send(await listOrderItemsQuery(request.params.id, input))
  })

  // ─── Commands ─────────────────────────────────────────────────────────────

  app.post('/orders', async (request, reply) => {
    const body = parseOrFail(CreateOrderSchema, request.body, reply)
    if (!body) return

    return reply.status(201).send(await createOrderCommand(body))
  })

  app.post<{ Params: { id: string } }>('/orders/:id/items', async (request, reply) => {
    const body = parseOrFail(AddItemSchema, request.body, reply)
    if (!body) return

    return reply.status(201).send(await addItemCommand(request.params.id, body))
  })

  app.delete<{ Params: { id: string; itemId: string } }>(
    '/orders/:id/items/:itemId',
    async (request, reply) => {
      await removeItemCommand(request.params.id, request.params.itemId)
      return reply.status(204).send()
    },
  )

  app.post<{ Params: { id: string } }>('/orders/:id/close', async (request, reply) => {
    await closeOrderCommand(request.params.id)
    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>('/orders/:id/cancel', async (request, reply) => {
    const body = parseOrFail(CancelOrderSchema, request.body ?? {}, reply)
    if (!body) return

    await cancelOrderCommand(request.params.id, body)
    return reply.status(204).send()
  })
}
