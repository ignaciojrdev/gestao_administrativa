import { loadStockState } from '../../helpers/load-stock-state.js'
import { persistEvent } from '../../helpers/persist-event.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { STOCK_EVENT_TYPE } from '../../constants/stock.constants.js'
import { assertSufficientStock } from '../../domain/stock.aggregate.js'
import type { DomainEvent, StockReservedData } from '../../domain/events.js'
import { z } from 'zod'

export const ReserveStockSchema = z.object({
  quantity: z.number().int().positive(),
  order_id: z.string().uuid(),
})

export type ReserveStockInput = z.infer<typeof ReserveStockSchema>

export async function reserveStockCommand(
  variantId: string,
  input: ReserveStockInput,
): Promise<void> {
  const state = await loadStockState(variantId)

  if (!state) {
    throw new BusinessError(t('errors.stock_not_found', { variantId }))
  }

  assertSufficientStock(state, input.quantity)

  const event: DomainEvent<StockReservedData> = {
    type: STOCK_EVENT_TYPE.STOCK_RESERVED,
    variant_id: variantId,
    data: { quantity: input.quantity, order_id: input.order_id },
  }

  await persistEvent(event)
}
