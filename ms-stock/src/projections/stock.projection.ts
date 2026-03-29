import type { Kysely } from 'kysely'
import { STOCK_EVENT_TYPE } from '../constants/stock.constants.js'
import type { Database } from '../types/database.js'
import type { DomainEvent, StockInData, StockOutData, StockReservedData, StockReleasedData } from '../domain/events.js'

export async function applyEventToProjection(
  db: Kysely<Database>,
  event: DomainEvent,
): Promise<void> {
  switch (event.type) {
    case STOCK_EVENT_TYPE.STOCK_IN: {
      const d = event.data as StockInData
      await db
        .insertInto('stock_projection')
        .values({ variant_id: event.variant_id, quantity: d.quantity, reserved: 0 })
        .onConflict((oc) =>
          oc.column('variant_id').doUpdateSet((eb) => ({
            quantity: eb('stock_projection.quantity', '+', d.quantity),
            updated_at: new Date(),
          })),
        )
        .execute()
      break
    }

    case STOCK_EVENT_TYPE.STOCK_OUT: {
      const d = event.data as StockOutData
      await db
        .updateTable('stock_projection')
        .set((eb) => ({
          quantity: eb('quantity', '-', d.quantity),
          updated_at: new Date(),
        }))
        .where('variant_id', '=', event.variant_id)
        .execute()
      break
    }

    case STOCK_EVENT_TYPE.STOCK_RESERVED: {
      const d = event.data as StockReservedData
      await db
        .updateTable('stock_projection')
        .set((eb) => ({
          reserved: eb('reserved', '+', d.quantity),
          updated_at: new Date(),
        }))
        .where('variant_id', '=', event.variant_id)
        .execute()
      break
    }

    case STOCK_EVENT_TYPE.STOCK_RELEASED: {
      const d = event.data as StockReleasedData
      await db
        .updateTable('stock_projection')
        .set((eb) => ({
          reserved: eb('reserved', '-', d.quantity),
          updated_at: new Date(),
        }))
        .where('variant_id', '=', event.variant_id)
        .execute()
      break
    }
  }
}
