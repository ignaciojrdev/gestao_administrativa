import { db } from '../../db.js'
import { NotFoundError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { availableQuantity } from '../../domain/stock.aggregate.js'

export interface StockDetail {
  variant_id: string
  quantity: number
  reserved: number
  available: number
  updated_at: Date
}

export async function getStockQuery(variantId: string): Promise<StockDetail> {
  const variant = await db
    .selectFrom('product_variants')
    .select('id')
    .where('id', '=', variantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!variant) {
    throw new NotFoundError(t('errors.variant_not_found', { id: variantId }))
  }

  const stock = await db
    .selectFrom('stock_projection')
    .selectAll()
    .where('variant_id', '=', variantId)
    .executeTakeFirst()

  if (!stock) {
    return { variant_id: variantId, quantity: 0, reserved: 0, available: 0, updated_at: new Date() }
  }

  return {
    ...stock,
    available: availableQuantity(stock),
  }
}
