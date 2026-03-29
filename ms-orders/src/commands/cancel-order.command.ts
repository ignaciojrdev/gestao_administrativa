import { loadOpenOrder } from '../helpers/load-order-state.js'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
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
  await loadOpenOrder(orderId)

  const event: DomainEvent<OrderCancelledData> = {
    type: ORDER_EVENT_TYPE.ORDER_CANCELLED,
    order_id: orderId,
    data: { reason: input.reason },
  }

  await persistEvent(event)
}
