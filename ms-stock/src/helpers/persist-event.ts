import { db } from '../db.js'
import { applyEventToProjection } from '../projections/stock.projection.js'
import type { DomainEvent } from '../domain/events.js'

/**
 * Persiste um evento no event store e atualiza a projeção em uma única transação.
 */
export async function persistEvent(event: DomainEvent): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('stock_events')
      .values({
        aggregate_id: event.variant_id,
        type: event.type,
        data: JSON.stringify(event.data),
      })
      .execute()

    await applyEventToProjection(trx, event)
  })
}
