import { describe, it, expect } from 'vitest'
import { rebuildOrderState, assertOrderIsOpen } from '../../../src/domain/order.aggregate.js'
import { NotFoundError, BusinessError } from '../../../src/helpers/errors.js'
import { ORDER_EVENT_TYPE, ORDER_STATUS } from '../../../src/constants/order.constants.js'
import type { OrderEvent } from '../../../src/types/database.js'

// ─── Factory de eventos mock ──────────────────────────────────────────────────

function makeEvent(type: string, data: object, orderId = 'order-1'): OrderEvent {
  return { id: 'evt-1', order_id: orderId, type, data, created_at: new Date() }
}

// ─── rebuildOrderState ────────────────────────────────────────────────────────

describe('rebuildOrderState', () => {
  it('retorna null para lista de eventos vazia', () => {
    expect(rebuildOrderState([])).toBeNull()
  })

  it('cria estado "open" após OrderCreated', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 3 }),
    ])
    expect(state).toEqual({ id: 'order-1', status: ORDER_STATUS.OPEN, items: [] })
  })

  it('adiciona item após ItemAdded', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-1', variant_id: 'var-1', quantity: 2 }),
    ])
    expect(state?.items).toHaveLength(1)
    expect(state?.items[0]).toMatchObject({ id: 'item-1', variant_id: 'var-1', quantity: 2 })
  })

  it('adiciona múltiplos itens em ordem correta', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-1', variant_id: 'var-1', quantity: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-2', variant_id: 'var-2', quantity: 3 }),
    ])
    expect(state?.items).toHaveLength(2)
    expect(state?.items[1]).toMatchObject({ id: 'item-2', quantity: 3 })
  })

  it('remove item após ItemRemoved', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-1', variant_id: 'var-1', quantity: 2 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-2', variant_id: 'var-2', quantity: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_REMOVED, { item_id: 'item-1' }),
    ])
    expect(state?.items).toHaveLength(1)
    expect(state?.items[0].id).toBe('item-2')
  })

  it('marca status "closed" após OrderClosed', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ORDER_CLOSED, { closed_at: new Date().toISOString() }),
    ])
    expect(state?.status).toBe(ORDER_STATUS.CLOSED)
  })

  it('marca status "cancelled" após OrderCancelled', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ORDER_CANCELLED, { reason: 'cliente desistiu' }),
    ])
    expect(state?.status).toBe(ORDER_STATUS.CANCELLED)
  })

  it('mantém itens ao fechar o pedido', () => {
    const state = rebuildOrderState([
      makeEvent(ORDER_EVENT_TYPE.ORDER_CREATED, { table_number: 1 }),
      makeEvent(ORDER_EVENT_TYPE.ITEM_ADDED, { item_id: 'item-1', variant_id: 'var-1', quantity: 2 }),
      makeEvent(ORDER_EVENT_TYPE.ORDER_CLOSED, { closed_at: new Date().toISOString() }),
    ])
    expect(state?.items).toHaveLength(1)
    expect(state?.status).toBe(ORDER_STATUS.CLOSED)
  })
})

// ─── assertOrderIsOpen ────────────────────────────────────────────────────────

describe('assertOrderIsOpen', () => {
  it('lança NotFoundError quando estado é null', () => {
    expect(() => assertOrderIsOpen(null, 'order-1')).toThrowError(NotFoundError)
  })

  it('mensagem de NotFoundError contém o id do pedido', () => {
    expect(() => assertOrderIsOpen(null, 'order-abc')).toThrowError(/order-abc/)
  })

  it('lança BusinessError quando pedido está fechado', () => {
    const state = { id: 'order-1', status: ORDER_STATUS.CLOSED, items: [] }
    expect(() => assertOrderIsOpen(state, 'order-1')).toThrowError(BusinessError)
  })

  it('lança BusinessError quando pedido está cancelado', () => {
    const state = { id: 'order-1', status: ORDER_STATUS.CANCELLED, items: [] }
    expect(() => assertOrderIsOpen(state, 'order-1')).toThrowError(BusinessError)
  })

  it('mensagem de BusinessError contém o status traduzido', () => {
    const state = { id: 'order-1', status: ORDER_STATUS.CLOSED, items: [] }
    expect(() => assertOrderIsOpen(state, 'order-1')).toThrowError(/fechado/)
  })

  it('não lança exceção quando pedido está aberto', () => {
    const state = { id: 'order-1', status: ORDER_STATUS.OPEN, items: [] }
    expect(() => assertOrderIsOpen(state, 'order-1')).not.toThrow()
  })
})
