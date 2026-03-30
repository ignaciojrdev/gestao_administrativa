import type { Kysely } from 'kysely'
import { sql } from 'kysely'
import { ORDER_STATUS, ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import type { Database } from '../types/database.js'
import type { DomainEvent, OrderCreatedData, ItemAddedData, ItemRemovedData } from '../domain/events.js'

export async function applyEventToProjection(
  db: Kysely<Database>,
  event: DomainEvent,
): Promise<void> {
  switch (event.type) {
    case ORDER_EVENT_TYPE.ORDER_CREATED: {
      const d = event.data as OrderCreatedData
      await db
        .insertInto('orders')
        .values({
          id: event.order_id,
          status: ORDER_STATUS.OPEN,
          table_number: d.table_number,
          total: 0,
        })
        .execute()
      break
    }

    case ORDER_EVENT_TYPE.ITEM_ADDED: {
      const d = event.data as ItemAddedData
      const lineTotal = d.quantity * d.unit_price

      await db
        .insertInto('order_items')
        .values({
          id: d.item_id,
          order_id: event.order_id,
          variant_id: d.variant_id,
          quantity: d.quantity,
          unit_price: d.unit_price,
          status: ORDER_STATUS.OPEN,
        })
        .execute()

      await db
        .updateTable('orders')
        .set((eb) => ({
          total: eb('total', '+', lineTotal),
          updated_at: new Date(),
        }))
        .where('id', '=', event.order_id)
        .execute()
      break
    }

    case ORDER_EVENT_TYPE.ITEM_REMOVED: {
      const d = event.data as ItemRemovedData

      const item = await db
        .selectFrom('order_items')
        .select(['quantity', 'unit_price'])
        .where('id', '=', d.item_id)
        .where('order_id', '=', event.order_id)
        .executeTakeFirst()

      await db
        .deleteFrom('order_items')
        .where('id', '=', d.item_id)
        .where('order_id', '=', event.order_id)
        .execute()

      if (item) {
        const lineTotal = item.quantity * item.unit_price
        await db
          .updateTable('orders')
          .set((eb) => ({
            total: eb('total', '-', lineTotal),
            updated_at: new Date(),
          }))
          .where('id', '=', event.order_id)
          .execute()
      }
      break
    }

    case ORDER_EVENT_TYPE.ORDER_CLOSED: {
      await db
        .updateTable('orders')
        .set({ status: ORDER_STATUS.CLOSED, updated_at: new Date() })
        .where('id', '=', event.order_id)
        .execute()
      break
    }

    case ORDER_EVENT_TYPE.ORDER_CANCELLED: {
      await db
        .updateTable('orders')
        .set({ status: ORDER_STATUS.CANCELLED, updated_at: new Date() })
        .where('id', '=', event.order_id)
        .execute()
      break
    }
  }
}
