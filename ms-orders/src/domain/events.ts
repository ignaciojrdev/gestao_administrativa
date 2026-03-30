import type { OrderEventType } from '../constants/order.constants.js'

export type { OrderEventType }

export interface OrderCreatedData {
  table_number: number
}

export interface ItemAddedData {
  item_id: string
  variant_id: string
  quantity: number
  unit_price: number
}

export interface ItemRemovedData {
  item_id: string
}

export interface OrderClosedData {
  closed_at: string
}

export interface OrderCancelledData {
  reason?: string
}

export type OrderEventData =
  | OrderCreatedData
  | ItemAddedData
  | ItemRemovedData
  | OrderClosedData
  | OrderCancelledData

export interface DomainEvent<T extends OrderEventData = OrderEventData> {
  type: OrderEventType
  order_id: string
  data: T
}
