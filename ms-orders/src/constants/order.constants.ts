export const ORDER_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_EVENT_TYPE = {
  ORDER_CREATED: 'OrderCreated',
  ITEM_ADDED: 'ItemAdded',
  ITEM_REMOVED: 'ItemRemoved',
  ORDER_CLOSED: 'OrderClosed',
  ORDER_CANCELLED: 'OrderCancelled',
} as const

export type OrderEventType = (typeof ORDER_EVENT_TYPE)[keyof typeof ORDER_EVENT_TYPE]

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const
