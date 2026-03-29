import { randomUUID } from 'crypto'
import { loadOpenOrder } from '../helpers/load-order-state.js'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import type { DomainEvent, ItemAddedData } from '../domain/events.js'
import { z } from 'zod'

export const AddItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export type AddItemInput = z.infer<typeof AddItemSchema>

export async function addItemCommand(
  orderId: string,
  input: AddItemInput,
): Promise<{ item_id: string }> {
  await loadOpenOrder(orderId)

  const itemId = randomUUID()

  const event: DomainEvent<ItemAddedData> = {
    type: ORDER_EVENT_TYPE.ITEM_ADDED,
    order_id: orderId,
    data: { item_id: itemId, variant_id: input.variant_id, quantity: input.quantity },
  }

  await persistEvent(event)

  return { item_id: itemId }
}
