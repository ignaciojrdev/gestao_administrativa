import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks de infraestrutura ──────────────────────────────────────────────────

const mockExecute = vi.fn()

vi.mock('../../src/db.js', () => ({ db: {} }))

vi.mock('kysely', async (importOriginal) => {
  const mod = await importOriginal<typeof import('kysely')>()
  return {
    ...mod,
    sql: new Proxy(() => {}, {
      apply: () => ({ execute: mockExecute }),
      get: (_target, prop) => {
        if (prop === 'execute') return mockExecute
        // Tagged template literal support
        return () => ({ execute: mockExecute })
      },
    }),
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
    mockExecute.mockResolvedValue([{ '?column?': 1 }])

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('ms-stock')
    expect(body.timestamp).toBeDefined()
  })

  it('retorna 503 quando banco está indisponível', async () => {
    mockExecute.mockRejectedValue(new Error('Connection refused'))

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(503)
    const body = res.json()
    expect(body.status).toBe('degraded')
    expect(body.service).toBe('ms-stock')
    expect(body.timestamp).toBeDefined()
  })
})
