import { STOCK_EVENT_TYPE } from '../constants/stock.constants.js'
import { BusinessError } from '../helpers/errors.js'
import { t } from '../i18n/index.js'
import type { StockEvent } from '../types/database.js'
import type { StockInData, StockOutData, StockReservedData, StockReleasedData } from './events.js'

export interface StockState {
  variant_id: string
  quantity: number
  reserved: number
}

export function rebuildStockState(events: StockEvent[]): StockState {
  const variantId = events[0].aggregate_id
  let quantity = 0
  let reserved = 0

  for (const event of events) {
    switch (event.type) {
      case STOCK_EVENT_TYPE.STOCK_IN: {
        const d = event.data as StockInData
        quantity += d.quantity
        break
      }
      case STOCK_EVENT_TYPE.STOCK_OUT: {
        const d = event.data as StockOutData
        quantity -= d.quantity
        break
      }
      case STOCK_EVENT_TYPE.STOCK_RESERVED: {
        const d = event.data as StockReservedData
        reserved += d.quantity
        break
      }
      case STOCK_EVENT_TYPE.STOCK_RELEASED: {
        const d = event.data as StockReleasedData
        reserved -= d.quantity
        break
      }
    }
  }

  return { variant_id: variantId, quantity, reserved }
}

// ─── Helpers de validação ─────────────────────────────────────────────────────

export function availableQuantity(state: StockState): number {
  return state.quantity - state.reserved
}

export function assertSufficientStock(state: StockState, requested: number): void {
  const available = availableQuantity(state)
  if (available < requested) {
    throw new BusinessError(
      t('errors.insufficient_stock', {
        available: String(available),
        requested: String(requested),
      }),
    )
  }
}

export function assertSufficientReserved(state: StockState, requested: number): void {
  if (state.reserved < requested) {
    throw new BusinessError(
      t('errors.insufficient_reserved', {
        reserved: String(state.reserved),
        requested: String(requested),
      }),
    )
  }
}

export function assertStockOutIsValid(state: StockState, requested: number): void {
  const available = availableQuantity(state)
  if (available < requested) {
    throw new BusinessError(
      t('errors.stock_out_exceeds_available', {
        requested: String(requested),
        available: String(available),
      }),
    )
  }
}
