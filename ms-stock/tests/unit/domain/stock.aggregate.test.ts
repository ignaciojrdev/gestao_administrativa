import { describe, it, expect } from 'vitest'
import {
  rebuildStockState,
  availableQuantity,
  assertSufficientStock,
  assertSufficientReserved,
  assertStockOutIsValid,
} from '../../../src/domain/stock.aggregate.js'
import { BusinessError } from '../../../src/helpers/errors.js'
import { STOCK_EVENT_TYPE } from '../../../src/constants/stock.constants.js'
import type { StockEvent } from '../../../src/types/database.js'

// ─── Factory de eventos mock ──────────────────────────────────────────────────

function makeEvent(type: string, data: object, variantId = 'var-1'): StockEvent {
  return { id: 'evt-1', aggregate_id: variantId, type, data, created_at: new Date() }
}

// ─── rebuildStockState ────────────────────────────────────────────────────────

describe('rebuildStockState', () => {
  it('inicia com quantity 0 após StockIn de zero itens — não deve ocorrer, mas testa o aggregate', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 0, reason: 'manual' }),
    ])
    expect(state.quantity).toBe(0)
    expect(state.reserved).toBe(0)
  })

  it('incrementa quantity após StockIn', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 50, reason: 'purchase' }),
    ])
    expect(state.quantity).toBe(50)
    expect(state.reserved).toBe(0)
    expect(state.variant_id).toBe('var-1')
  })

  it('acumula múltiplas entradas', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 20, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 30, reason: 'return' }),
    ])
    expect(state.quantity).toBe(50)
  })

  it('decrementa quantity após StockOut', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 40, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_OUT, { quantity: 10, reason: 'manual' }),
    ])
    expect(state.quantity).toBe(30)
  })

  it('incrementa reserved após StockReserved', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 20, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RESERVED, { quantity: 5, order_id: 'order-1' }),
    ])
    expect(state.quantity).toBe(20)
    expect(state.reserved).toBe(5)
  })

  it('decrementa reserved após StockReleased', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 20, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RESERVED, { quantity: 8, order_id: 'order-1' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RELEASED, { quantity: 8, order_id: 'order-1' }),
    ])
    expect(state.reserved).toBe(0)
    expect(state.quantity).toBe(20)
  })

  it('decrementa quantity e reserved após StockConsumed', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 20, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RESERVED, { quantity: 5, order_id: 'order-1' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_CONSUMED, { quantity: 5, order_id: 'order-1' }),
    ])
    expect(state.quantity).toBe(15)
    expect(state.reserved).toBe(0)
  })

  it('combina múltiplos eventos em sequência realista', () => {
    const state = rebuildStockState([
      makeEvent(STOCK_EVENT_TYPE.STOCK_IN, { quantity: 100, reason: 'purchase' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RESERVED, { quantity: 10, order_id: 'order-1' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RESERVED, { quantity: 5, order_id: 'order-2' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_RELEASED, { quantity: 10, order_id: 'order-1' }),
      makeEvent(STOCK_EVENT_TYPE.STOCK_CONSUMED, { quantity: 5, order_id: 'order-2' }),
    ])
    expect(state.quantity).toBe(95)
    expect(state.reserved).toBe(0)
  })
})

// ─── availableQuantity ────────────────────────────────────────────────────────

describe('availableQuantity', () => {
  it('retorna quantity - reserved', () => {
    expect(availableQuantity({ variant_id: 'v', quantity: 30, reserved: 8 })).toBe(22)
  })

  it('retorna 0 quando tudo está reservado', () => {
    expect(availableQuantity({ variant_id: 'v', quantity: 10, reserved: 10 })).toBe(0)
  })
})

// ─── assertSufficientStock ────────────────────────────────────────────────────

describe('assertSufficientStock', () => {
  const state = { variant_id: 'v', quantity: 20, reserved: 5 }

  it('não lança quando disponível >= solicitado', () => {
    expect(() => assertSufficientStock(state, 15)).not.toThrow()
  })

  it('não lança quando disponível == solicitado', () => {
    expect(() => assertSufficientStock(state, 15)).not.toThrow()
  })

  it('lança BusinessError quando disponível < solicitado', () => {
    expect(() => assertSufficientStock(state, 16)).toThrowError(BusinessError)
  })

  it('mensagem contém quantidade disponível e solicitada', () => {
    expect(() => assertSufficientStock(state, 20)).toThrowError(/15/)
  })
})

// ─── assertSufficientReserved ─────────────────────────────────────────────────

describe('assertSufficientReserved', () => {
  const state = { variant_id: 'v', quantity: 20, reserved: 6 }

  it('não lança quando reserved >= solicitado', () => {
    expect(() => assertSufficientReserved(state, 6)).not.toThrow()
  })

  it('lança BusinessError quando reserved < solicitado', () => {
    expect(() => assertSufficientReserved(state, 7)).toThrowError(BusinessError)
  })
})

// ─── assertStockOutIsValid ────────────────────────────────────────────────────

describe('assertStockOutIsValid', () => {
  const state = { variant_id: 'v', quantity: 20, reserved: 5 }

  it('não lança quando disponível >= solicitado', () => {
    expect(() => assertStockOutIsValid(state, 15)).not.toThrow()
  })

  it('lança BusinessError quando disponível < solicitado', () => {
    expect(() => assertStockOutIsValid(state, 16)).toThrowError(BusinessError)
  })
})
