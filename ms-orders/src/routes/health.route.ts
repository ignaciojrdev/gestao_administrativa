import type { FastifyInstance } from 'fastify'
import { db } from '../db.js'
import { sql } from 'kysely'

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    try {
      await sql`SELECT 1`.execute(db)
      return reply.send({ status: 'ok', service: 'ms-orders', timestamp: new Date().toISOString() })
    } catch {
      return reply.status(503).send({ status: 'degraded', service: 'ms-orders', timestamp: new Date().toISOString() })
    }
  })
}
