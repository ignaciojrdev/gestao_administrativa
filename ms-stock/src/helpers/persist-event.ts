import { db } from '../db.js'
import { applyEventToProjection } from '../projections/stock.projection.js'
import { ConflictError } from './errors.js'
import { t } from '../i18n/index.js'
import type { DomainEvent } from '../domain/events.js'

/**
 * Persiste um evento no event store e atualiza a projeção em uma única transação.
 *
 * @param event - Evento de domínio a persistir
 * @param idempotencyKey - Chave de idempotência opcional (ex: ID do evento do ms-orders).
 *   Se fornecida, garante que o mesmo evento não seja processado duas vezes.
 */
export async function persistEvent(event: DomainEvent, idempotencyKey?: string): Promise<void> {
  await db.transaction().execute(async (trx) => {
    if (idempotencyKey) {
      const alreadyProcessed = await trx
        .selectFrom('processed_events')
        .select('event_id')
        .where('event_id', '=', idempotencyKey)
        .executeTakeFirst()

      if (alreadyProcessed) {
        throw new ConflictError(t('errors.duplicate_event', { eventId: idempotencyKey }))
      }

      await trx
        .insertInto('processed_events')
        .values({ event_id: idempotencyKey })
        .execute()
    }

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
