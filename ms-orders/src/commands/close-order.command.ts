import { randomUUID } from 'crypto'
import { loadOpenOrder } from '../helpers/load-order-state.js'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import { BusinessError } from '../helpers/errors.js'
import { stockClient } from '../clients/stock.client.js'
import { t } from '../i18n/index.js'
import type { DomainEvent, OrderClosedData } from '../domain/events.js'

export async function closeOrderCommand(orderId: string): Promise<void> {
  const state = await loadOpenOrder(orderId)

  if (state.items.length === 0) {
    throw new BusinessError(t('errors.close_empty_order'))
  }

  const eventId = randomUUID()

  // 1. Consome o estoque de cada item (decrementa quantity + reserved)
  await Promise.all(
    state.items.map((item) =>
      stockClient.consume({
        variantId: item.variant_id,
        quantity: item.quantity,
        orderId,
        idempotencyKey: randomUUID(),
      }),
    ),
  )

  // 2. Persiste o evento de fechamento
  const event: DomainEvent<OrderClosedData> = {
    type: ORDER_EVENT_TYPE.ORDER_CLOSED,
    order_id: orderId,
    data: { closed_at: new Date().toISOString() },
  }

  await persistEvent(event, eventId)
}
