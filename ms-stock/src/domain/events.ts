import type { StockEventType, StockAdjustmentReason } from '../constants/stock.constants.js'

export type { StockEventType }

export interface StockInData {
  quantity: number
  reason: StockAdjustmentReason
}

export interface StockOutData {
  quantity: number
  reason: StockAdjustmentReason
}

export interface StockReservedData {
  quantity: number
  order_id: string
}

export interface StockReleasedData {
  quantity: number
  order_id: string
}

export type StockEventData =
  | StockInData
  | StockOutData
  | StockReservedData
  | StockReleasedData

export interface DomainEvent<T extends StockEventData = StockEventData> {
  type: StockEventType
  variant_id: string
  data: T
}
