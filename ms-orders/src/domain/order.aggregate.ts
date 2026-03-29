import { ORDER_STATUS, ORDER_EVENT_TYPE } from '../constants/order.constants.js'
import type { OrderStatus } from '../constants/order.constants.js'
import type { OrderEvent } from '../types/database.js'
import type { ItemAddedData, ItemRemovedData } from './events.js'
import { NotFoundError, BusinessError } from '../helpers/errors.js'
import { t, tStatus } from '../i18n/index.js'

export interface OrderState {
  id: string
  status: OrderStatus
  items: Array<{ id: string; variant_id: string; quantity: number; status: string }>
}

export function rebuildOrderState(events: OrderEvent[]): OrderState | null {
  if (events.length === 0) return null

  let state: OrderState | null = null

  for (const event of events) {
    switch (event.type) {
      case ORDER_EVENT_TYPE.ORDER_CREATED: {
        state = { id: event.order_id, status: ORDER_STATUS.OPEN, items: [] }
        break
      }
      case ORDER_EVENT_TYPE.ITEM_ADDED: {
        if (!state) break
        const d = event.data as ItemAddedData
        state.items.push({
          id: d.item_id,
          variant_id: d.variant_id,
          quantity: d.quantity,
          status: ORDER_STATUS.OPEN,
        })
        break
      }
      case ORDER_EVENT_TYPE.ITEM_REMOVED: {
        if (!state) break
        const d = event.data as ItemRemovedData
        state.items = state.items.filter((i) => i.id !== d.item_id)
        break
      }
      case ORDER_EVENT_TYPE.ORDER_CLOSED: {
        if (state) state.status = ORDER_STATUS.CLOSED
        break
      }
      case ORDER_EVENT_TYPE.ORDER_CANCELLED: {
        if (state) state.status = ORDER_STATUS.CANCELLED
        break
      }
    }
  }

  return state
}

export function assertOrderIsOpen(state: OrderState | null, orderId: string): void {
  if (!state) {
    throw new NotFoundError(t('errors.order_not_found', { id: orderId }))
  }
  if (state.status !== ORDER_STATUS.OPEN) {
    throw new BusinessError(
      t('errors.order_not_open', { id: orderId, status: tStatus(state.status) }),
    )
  }
}
