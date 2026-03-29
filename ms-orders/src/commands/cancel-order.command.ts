import { randomUUID } from 'crypto'
import { loadOpenOrder } from '../helpers/load-order-state.js'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import { stockClient } from '../clients/stock.client.js'
import type { DomainEvent, OrderCancelledData } from '../domain/events.js'
import { z } from 'zod'

export const CancelOrderSchema = z.object({
  reason: z.string().optional(),
})

export type CancelOrderInput = z.infer<typeof CancelOrderSchema>

export async function cancelOrderCommand(
  orderId: string,
  input: CancelOrderInput = {},
): Promise<void> {
  const state = await loadOpenOrder(orderId)

  const eventId = randomUUID()

  // 1. Libera a reserva de cada item antes de cancelar
  if (state.items.length > 0) {
    await Promise.all(
      state.items.map((item) =>
        stockClient.release({
          variantId: item.variant_id,
          quantity: item.quantity,
          orderId,
          idempotencyKey: `${eventId}-${item.id}`,
        }),
      ),
    )
  }

  // 2. Persiste o evento de cancelamento
  const event: DomainEvent<OrderCancelledData> = {
    type: ORDER_EVENT_TYPE.ORDER_CANCELLED,
    order_id: orderId,
    data: { reason: input.reason },
  }

  await persistEvent(event, eventId)
}
