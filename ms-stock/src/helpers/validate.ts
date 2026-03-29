import type { FastifyReply } from 'fastify'
import type { ZodSchema } from 'zod'

/**
 * Faz o parse de um payload com Zod.
 * Em caso de erro, responde com 400 e retorna null — use early return no handler.
 *
 * @example
 * const body = parseOrFail(CreateProductSchema, request.body, reply)
 * if (!body) return
 */
export function parseOrFail<T>(
  schema: ZodSchema<T>,
  data: unknown,
  reply: FastifyReply,
): T | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    reply.status(400).send({ error: result.error.flatten() })
    return null
  }
  return result.data
}
