import { loadStockState } from '../../helpers/load-stock-state.js'
import { persistEvent } from '../../helpers/persist-event.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { STOCK_EVENT_TYPE, STOCK_ADJUSTMENT_REASON } from '../../constants/stock.constants.js'
import type { StockAdjustmentReason } from '../../constants/stock.constants.js'
import { assertStockOutIsValid } from '../../domain/stock.aggregate.js'
import type { DomainEvent, StockOutData } from '../../domain/events.js'
import { z } from 'zod'

export const StockOutSchema = z.object({
  quantity: z.number().int().positive(),
  reason: z.enum([STOCK_ADJUSTMENT_REASON.MANUAL, STOCK_ADJUSTMENT_REASON.LOSS]),
})

export type StockOutInput = z.infer<typeof StockOutSchema>

export async function stockOutCommand(variantId: string, input: StockOutInput): Promise<void> {
  const state = await loadStockState(variantId)

  if (!state) {
    throw new BusinessError(t('errors.stock_not_found', { variantId }))
  }

  assertStockOutIsValid(state, input.quantity)

  const event: DomainEvent<StockOutData> = {
    type: STOCK_EVENT_TYPE.STOCK_OUT,
    variant_id: variantId,
    data: { quantity: input.quantity, reason: input.reason as StockAdjustmentReason },
  }

  await persistEvent(event)
}
