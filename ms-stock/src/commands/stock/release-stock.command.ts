import { loadStockState } from '../../helpers/load-stock-state.js'
import { persistEvent } from '../../helpers/persist-event.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { STOCK_EVENT_TYPE } from '../../constants/stock.constants.js'
import { assertSufficientReserved } from '../../domain/stock.aggregate.js'
import type { DomainEvent, StockReleasedData } from '../../domain/events.js'
import { z } from 'zod'

export const ReleaseStockSchema = z.object({
  quantity: z.number().int().positive(),
  order_id: z.string().uuid(),
})

export type ReleaseStockInput = z.infer<typeof ReleaseStockSchema>

export async function releaseStockCommand(
  variantId: string,
  input: ReleaseStockInput,
): Promise<void> {
  const state = await loadStockState(variantId)

  if (!state) {
    throw new BusinessError(t('errors.stock_not_found', { variantId }))
  }

  assertSufficientReserved(state, input.quantity)

  const event: DomainEvent<StockReleasedData> = {
    type: STOCK_EVENT_TYPE.STOCK_RELEASED,
    variant_id: variantId,
    data: { quantity: input.quantity, order_id: input.order_id },
  }

  await persistEvent(event)
}
