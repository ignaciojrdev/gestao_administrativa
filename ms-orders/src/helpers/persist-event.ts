import { db } from '../db.js'
import { applyEventToProjection } from '../projections/order.projection.js'
import type { DomainEvent } from '../domain/events.js'

/**
 * Persiste um evento no event store e atualiza a projeção em uma única transação.
 */
export async function persistEvent(event: DomainEvent): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('order_events')
      .values({
        order_id: event.order_id,
        type: event.type,
        data: JSON.stringify(event.data),
      })
      .execute()

    await applyEventToProjection(trx, event)
  })
}
