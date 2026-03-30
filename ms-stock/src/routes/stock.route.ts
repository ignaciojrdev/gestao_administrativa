import type { FastifyInstance } from 'fastify'
import { parseOrFail } from '../helpers/validate.js'
import { stockInCommand, StockInSchema } from '../commands/stock/stock-in.command.js'
import { stockOutCommand, StockOutSchema } from '../commands/stock/stock-out.command.js'
import { reserveStockCommand, ReserveStockSchema } from '../commands/stock/reserve-stock.command.js'
import { releaseStockCommand, ReleaseStockSchema } from '../commands/stock/release-stock.command.js'
import { consumeStockCommand, ConsumeStockSchema } from '../commands/stock/consume-stock.command.js'
import { getStockQuery } from '../queries/stock/get-stock.query.js'
import { listStockQuery, ListStockSchema } from '../queries/stock/list-stock.query.js'
import { getStockHistoryQuery, StockHistorySchema } from '../queries/stock/get-stock-history.query.js'

export async function stockRoute(app: FastifyInstance): Promise<void> {
  // ─── Queries ──────────────────────────────────────────────────────────────

  app.get('/stock', async (request, reply) => {
    const input = parseOrFail(ListStockSchema, request.query, reply)
    if (!input) return

    return reply.send(await listStockQuery(input))
  })

  app.get<{ Params: { variantId: string } }>('/stock/:variantId', async (request, reply) => {
    return reply.send(await getStockQuery(request.params.variantId))
  })

  app.get<{ Params: { variantId: string } }>('/stock/:variantId/history', async (request, reply) => {
    const input = parseOrFail(StockHistorySchema, request.query, reply)
    if (!input) return

    return reply.send(await getStockHistoryQuery(request.params.variantId, input))
  })

  // ─── Commands ─────────────────────────────────────────────────────────────

  app.post<{ Params: { variantId: string } }>('/stock/:variantId/in', async (request, reply) => {
    const body = parseOrFail(StockInSchema, request.body, reply)
    if (!body) return

    await stockInCommand(request.params.variantId, body)
    return reply.status(204).send()
  })

  app.post<{ Params: { variantId: string } }>('/stock/:variantId/out', async (request, reply) => {
    const body = parseOrFail(StockOutSchema, request.body, reply)
    if (!body) return

    await stockOutCommand(request.params.variantId, body)
    return reply.status(204).send()
  })

  app.post<{ Params: { variantId: string } }>('/stock/:variantId/reserve', async (request, reply) => {
    const body = parseOrFail(ReserveStockSchema, request.body, reply)
    if (!body) return

    await reserveStockCommand(request.params.variantId, body)
    return reply.status(204).send()
  })

  app.post<{ Params: { variantId: string } }>('/stock/:variantId/release', async (request, reply) => {
    const body = parseOrFail(ReleaseStockSchema, request.body, reply)
    if (!body) return

    await releaseStockCommand(request.params.variantId, body)
    return reply.status(204).send()
  })

  app.post<{ Params: { variantId: string } }>('/stock/:variantId/consume', async (request, reply) => {
    const body = parseOrFail(ConsumeStockSchema, request.body, reply)
    if (!body) return

    await consumeStockCommand(request.params.variantId, body)
    return reply.status(204).send()
  })
}
