import type { FastifyInstance } from 'fastify'
import { parseOrFail } from '../helpers/validate.js'
import { salesReportQuery, SalesReportSchema } from '../queries/reports/sales-report.query.js'
import { topProductsQuery, TopProductsSchema } from '../queries/reports/top-products.query.js'

export async function reportsRoute(app: FastifyInstance): Promise<void> {
  app.get('/reports/sales', async (request, reply) => {
    const input = parseOrFail(SalesReportSchema, request.query, reply)
    if (!input) return

    return reply.send(await salesReportQuery(input))
  })

  app.get('/reports/top-products', async (request, reply) => {
    const input = parseOrFail(TopProductsSchema, request.query, reply)
    if (!input) return

    return reply.send(await topProductsQuery(input))
  })
}
