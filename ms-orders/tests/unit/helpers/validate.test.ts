import { describe, it, expect, vi } from 'vitest'
import { parseOrFail } from '../../../src/helpers/validate.js'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), age: z.number().int().positive() })

function makeMockReply() {
  const send = vi.fn()
  const status = vi.fn().mockReturnValue({ send })
  return { status, send, _send: send }
}

describe('parseOrFail', () => {
  it('retorna os dados parseados quando válidos', () => {
    const reply = makeMockReply()
    const result = parseOrFail(schema, { name: 'Teste', age: 25 }, reply as any)
    expect(result).toEqual({ name: 'Teste', age: 25 })
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('retorna null quando dados são inválidos', () => {
    const reply = makeMockReply()
    const result = parseOrFail(schema, { name: '', age: -1 }, reply as any)
    expect(result).toBeNull()
  })

  it('chama reply.status(400) quando dados são inválidos', () => {
    const reply = makeMockReply()
    parseOrFail(schema, { name: 123 }, reply as any)
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('chama reply.send com objeto de erro quando inválido', () => {
    const reply = makeMockReply()
    parseOrFail(schema, {}, reply as any)
    expect(reply._send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Object) }),
    )
  })

  it('retorna null para undefined', () => {
    const reply = makeMockReply()
    const result = parseOrFail(schema, undefined, reply as any)
    expect(result).toBeNull()
  })
})
