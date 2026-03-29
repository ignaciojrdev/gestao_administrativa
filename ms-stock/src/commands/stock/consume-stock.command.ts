import { loadStockState } from '../../helpers/load-stock-state.js'
import { persistEvent } from '../../helpers/persist-event.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { STOCK_EVENT_TYPE } from '../../constants/stock.constants.js'
import { assertSufficientReserved } from '../../domain/stock.aggregate.js'
import type { DomainEvent, StockConsumedData } from '../../domain/events.js'
import { z } from 'zod'

export const ConsumeStockSchema = z.object({
  quantity: z.number().int().positive(),
  order_id: z.string().uuid(),
  idempotency_key: z.string().uuid().optional(),
})

export type ConsumeStockInput = z.infer<typeof ConsumeStockSchema>

export async function consumeStockCommand(
  variantId: string,
  input: ConsumeStockInput,
): Promise<void> {
  const state = await loadStockState(variantId)

  if (!state) {
    throw new BusinessError(t('errors.stock_not_found', { variantId }))
  }

  assertSufficientReserved(state, input.quantity)

  const event: DomainEvent<StockConsumedData> = {
    type: STOCK_EVENT_TYPE.STOCK_CONSUMED,
    variant_id: variantId,
    data: { quantity: input.quantity, order_id: input.order_id },
  }

  await persistEvent(event, input.idempotency_key)
}
