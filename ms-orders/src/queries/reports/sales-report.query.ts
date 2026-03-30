import { db } from '../../db.js'
import { ORDER_STATUS } from '../../constants/order.constants.js'
import { BusinessError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { z } from 'zod'

export const SalesReportSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
})

export type SalesReportInput = z.infer<typeof SalesReportSchema>

export interface SalesReport {
  total_revenue: number
  order_count: number
  average_order_value: number
  period: { start: string; end: string }
}

export async function salesReportQuery(input: SalesReportInput): Promise<SalesReport> {
  if (input.start_date >= input.end_date) {
    throw new BusinessError(t('errors.invalid_date_range'))
  }

  const result = await db
    .selectFrom('orders')
    .select([
      db.fn.sum<number>('total').as('total_revenue'),
      db.fn.countAll<number>().as('order_count'),
    ])
    .where('status', '=', ORDER_STATUS.CLOSED)
    .where('updated_at', '>=', input.start_date)
    .where('updated_at', '<=', input.end_date)
    .executeTakeFirstOrThrow()

  const totalRevenue = Number(result.total_revenue) || 0
  const orderCount = Number(result.order_count) || 0

  return {
    total_revenue: totalRevenue,
    order_count: orderCount,
    average_order_value: orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0,
    period: {
      start: input.start_date.toISOString(),
      end: input.end_date.toISOString(),
    },
  }
}
