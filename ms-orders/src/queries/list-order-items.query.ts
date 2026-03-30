import { db } from '../db.js'
import { PAGINATION } from '../constants/order.constants.js'
import { NotFoundError } from '../helpers/errors.js'
import { t } from '../i18n/index.js'
import { z } from 'zod'

export const ListOrderItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
})

export type ListOrderItemsInput = z.infer<typeof ListOrderItemsSchema>

export interface OrderItemSummary {
  id: string
  variant_id: string
  quantity: number
  unit_price: number
  status: string
  created_at: Date
}

export interface PaginatedOrderItems {
  data: OrderItemSummary[]
  total: number
  page: number
  limit: number
}

export async function listOrderItemsQuery(
  orderId: string,
  input: ListOrderItemsInput,
): Promise<PaginatedOrderItems> {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const order = await db
    .selectFrom('orders')
    .select('id')
    .where('id', '=', orderId)
    .executeTakeFirst()

  if (!order) throw new NotFoundError(t('errors.order_not_found', { id: orderId }))

  const [data, countResult] = await Promise.all([
    db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', orderId)
      .orderBy('created_at', 'asc')
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom('order_items')
      .select(db.fn.countAll<number>().as('total'))
      .where('order_id', '=', orderId)
      .executeTakeFirstOrThrow(),
  ])

  return { data, total: Number(countResult.total), page, limit }
}
