import { db } from '../../db.js'
import { ORDER_STATUS } from '../../constants/order.constants.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { z } from 'zod'

export const TopProductsSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export type TopProductsInput = z.infer<typeof TopProductsSchema>

export interface TopProduct {
  variant_id: string
  total_quantity: number
  total_revenue: number
}

export async function topProductsQuery(input: TopProductsInput): Promise<TopProduct[]> {
  if (input.start_date >= input.end_date) {
    throw new BusinessError(t('errors.invalid_date_range'))
  }

  const rows = await db
    .selectFrom('order_items as oi')
    .innerJoin('orders as o', 'o.id', 'oi.order_id')
    .select([
      'oi.variant_id',
      db.fn.sum<number>('oi.quantity').as('total_quantity'),
      db.fn.sum<number>(db.fn.sql<number>('oi.quantity * oi.unit_price')).as('total_revenue'),
    ])
    .where('o.status', '=', ORDER_STATUS.CLOSED)
    .where('o.updated_at', '>=', input.start_date)
    .where('o.updated_at', '<=', input.end_date)
    .groupBy('oi.variant_id')
    .orderBy('total_revenue', 'desc')
    .limit(input.limit)
    .execute()

  return rows.map((r) => ({
    variant_id: r.variant_id,
    total_quantity: Number(r.total_quantity),
    total_revenue: Number(r.total_revenue),
  }))
}
