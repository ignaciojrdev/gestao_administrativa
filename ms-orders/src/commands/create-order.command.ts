import { randomUUID } from 'crypto'
import { persistEvent } from '../helpers/persist-event.js'
import { ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import type { DomainEvent, OrderCreatedData } from '../domain/events.js'
import { z } from 'zod'

export const CreateOrderSchema = z.object({
  table_number: z.number().int().positive(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export async function createOrderCommand(input: CreateOrderInput): Promise<{ id: string }> {
  const orderId = randomUUID()

  const event: DomainEvent<OrderCreatedData> = {
    type: ORDER_EVENT_TYPE.ORDER_CREATED,
    order_id: orderId,
    data: { table_number: input.table_number },
  }

  await persistEvent(event)

  return { id: orderId }
}
