import { persistEvent } from '../../helpers/persist-event.js'
import { NotFoundError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { db } from '../../db.js'
import { STOCK_EVENT_TYPE, STOCK_ADJUSTMENT_REASON } from '../../constants/stock.constants.js'
import type { StockAdjustmentReason } from '../../constants/stock.constants.js'
import type { DomainEvent, StockInData } from '../../domain/events.js'
import { z } from 'zod'

export const StockInSchema = z.object({
  quantity: z.number().int().positive(),
  reason: z.enum([
    STOCK_ADJUSTMENT_REASON.PURCHASE,
    STOCK_ADJUSTMENT_REASON.RETURN,
    STOCK_ADJUSTMENT_REASON.MANUAL,
  ]),
})

export type StockInInput = z.infer<typeof StockInSchema>

export async function stockInCommand(variantId: string, input: StockInInput): Promise<void> {
  const variant = await db
    .selectFrom('product_variants')
    .select('id')
    .where('id', '=', variantId)
    .executeTakeFirst()

  if (!variant) {
    throw new NotFoundError(t('errors.variant_not_found', { id: variantId }))
  }

  const event: DomainEvent<StockInData> = {
    type: STOCK_EVENT_TYPE.STOCK_IN,
    variant_id: variantId,
    data: { quantity: input.quantity, reason: input.reason as StockAdjustmentReason },
  }

  await persistEvent(event)
}
