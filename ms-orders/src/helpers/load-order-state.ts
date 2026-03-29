import { db } from '../db.js'
import { rebuildOrderState, assertOrderIsOpen } from '../domain/order.aggregate.js'
import type { OrderState } from '../domain/order.aggregate.js'

/**
 * Busca os eventos de uma order, reconstrói o estado e valida que está aberta.
 * Lança erro se não encontrada ou se não estiver com status 'open'.
 */
export async function loadOpenOrder(orderId: string): Promise<OrderState> {
  const events = await db
    .selectFrom('order_events')
    .selectAll()
    .where('order_id', '=', orderId)
    .orderBy('created_at', 'asc')
    .execute()

  const state = rebuildOrderState(events)
  assertOrderIsOpen(state, orderId)

  return state!
}
