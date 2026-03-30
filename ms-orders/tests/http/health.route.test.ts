import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

vi.mock('../../src/db.js', () => ({ db: {} }))

vi.mock('../../src/clients/stock.client.js', () => ({
  stockClient: { reserve: vi.fn(), release: vi.fn(), consume: vi.fn() },
}))

// ─── Mock do módulo kysely (sql tag) ──────────────────────────────────────────

const executeMock = vi.fn()
vi.mock('kysely', async (importOriginal) => {
  const mod = await importOriginal<typeof import('kysely')>()
  return {
    ...mod,
    sql: new Proxy(
      function () {
        return { execute: executeMock }
      },
      {
        apply(_target, _thisArg, _args) {
          return { execute: executeMock }
        },
      },
    ),
  }
})

// ─── Imports após mocks ───────────────────────────────────────────────────────

const { buildApp } = await import('../../src/app.js')

// ─── Setup ────────────────────────────────────────────────────────────────────

let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = buildApp()
  await app.ready()
})

// ─── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('retorna status ok quando banco está acessível', async () => {
    executeMock.mockResolvedValue(undefined)

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('ms-orders')
    expect(body).toHaveProperty('timestamp')
  })

  it('retorna timestamp no formato ISO', async () => {
    executeMock.mockResolvedValue(undefined)

    const res = await app.inject({ method: 'GET', url: '/health' })
    const body = res.json()

    expect(() => new Date(body.timestamp).toISOString()).not.toThrow()
  })

  it('retorna 503 quando banco está inacessível', async () => {
    executeMock.mockRejectedValue(new Error('Connection refused'))

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(503)
    const body = res.json()
    expect(body.status).toBe('degraded')
    expect(body.service).toBe('ms-orders')
    expect(body).toHaveProperty('timestamp')
  })
})
