import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

// ─── orders ────────────────────────────────────────────────────────────────

export interface OrdersTable {
  id: Generated<string>
  status: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Order = Selectable<OrdersTable>
export type NewOrder = Insertable<OrdersTable>
export type OrderUpdate = Updateable<OrdersTable>

// ─── order_items ────────────────────────────────────────────────────────────

export interface OrderItemsTable {
  id: Generated<string>
  order_id: string
  variant_id: string
  quantity: number
  status: string
  created_at: Generated<Date>
}

export type OrderItem = Selectable<OrderItemsTable>
export type NewOrderItem = Insertable<OrderItemsTable>
export type OrderItemUpdate = Updateable<OrderItemsTable>

// ─── order_events ───────────────────────────────────────────────────────────

export interface OrderEventsTable {
  id: Generated<string> | string  // aceita UUID externo para idempotência
  order_id: string
  type: string
  data: unknown
  created_at: Generated<Date>
}

export type OrderEvent = Selectable<OrderEventsTable>
export type NewOrderEvent = Insertable<OrderEventsTable>

// ─── Database ───────────────────────────────────────────────────────────────

export interface Database {
  orders: OrdersTable
  order_items: OrderItemsTable
  order_events: OrderEventsTable
}
