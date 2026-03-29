export const STOCK_EVENT_TYPE = {
  STOCK_IN: 'StockIn',
  STOCK_OUT: 'StockOut',
  STOCK_RESERVED: 'StockReserved',
  STOCK_RELEASED: 'StockReleased',
  STOCK_CONSUMED: 'StockConsumed',
} as const

export type StockEventType = (typeof STOCK_EVENT_TYPE)[keyof typeof STOCK_EVENT_TYPE]

export const STOCK_ADJUSTMENT_REASON = {
  PURCHASE: 'purchase',
  RETURN: 'return',
  MANUAL: 'manual',
  LOSS: 'loss',
} as const

export type StockAdjustmentReason =
  (typeof STOCK_ADJUSTMENT_REASON)[keyof typeof STOCK_ADJUSTMENT_REASON]

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const
