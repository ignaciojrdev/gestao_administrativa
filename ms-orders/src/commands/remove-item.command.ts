import { randomUUID } from 'crypto'
import { loadOpenOrder } from '../helpers/load-order-state.js'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import { NotFoundError } from '../helpers/errors.js'
import { stockClient } from '../clients/stock.client.js'
import { t } from '../i18n/index.js'
import type { DomainEvent, ItemRemovedData } from '../domain/events.js'

export async function removeItemCommand(orderId: string, itemId: string): Promise<void> {
  const state = await loadOpenOrder(orderId)

  const item = state.items.find((i) => i.id === itemId)
  if (!item) {
    throw new NotFoundError(t('errors.item_not_found', { itemId, orderId }))
  }

  const eventId = randomUUID()

  // 1. Libera a reserva no estoque antes de persistir
  await stockClient.release({
    variantId: item.variant_id,
    quantity: item.quantity,
    orderId,
    idempotencyKey: eventId,
  })

  // 2. Persiste o evento
  const event: DomainEvent<ItemRemovedData> = {
    type: ORDER_EVENT_TYPE.ITEM_REMOVED,
    order_id: orderId,
    data: { item_id: itemId },
  }

  await persistEvent(event, eventId)
}
