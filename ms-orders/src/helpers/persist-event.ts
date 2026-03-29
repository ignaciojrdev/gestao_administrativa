import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { applyEventToProjection } from '../projections/order.projection.js'
import type { DomainEvent } from '../domain/events.js'

/**
 * Persiste um evento no event store e atualiza a projeção em uma única transação.
 * Aceita um eventId externo para permitir que o chamador use o ID como
 * chave de idempotência em chamadas a outros serviços antes da persistência.
 *
 * @returns O ID do evento persistido
 */
export async function persistEvent(event: DomainEvent, eventId?: string): Promise<{ eventId: string }> {
  const id = eventId ?? randomUUID()

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('order_events')
      .values({
        id,
        order_id: event.order_id,
        type: event.type,
        data: JSON.stringify(event.data),
      })
      .execute()

    await applyEventToProjection(trx, event)
  })

  return { eventId: id }
}
