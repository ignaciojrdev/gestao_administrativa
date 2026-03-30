import { db } from '../db.js'
import { NotFoundError } from '../helpers/errors.js'
import { t } from '../i18n/index.js'

export interface OrderDetail {
  id: string
  status: string
  table_number: number | null
  total: number
  created_at: Date
  updated_at: Date
  items: Array<{
    id: string
    variant_id: string
    quantity: number
    unit_price: number
    status: string
    created_at: Date
  }>
}

export async function getOrderQuery(orderId: string): Promise<OrderDetail> {
  const order = await db
    .selectFrom('orders')
    .selectAll()
    .where('id', '=', orderId)
    .executeTakeFirst()

  if (!order) throw new NotFoundError(t('errors.order_not_found', { id: orderId }))

  const items = await db
    .selectFrom('order_items')
    .selectAll()
    .where('order_id', '=', orderId)
    .orderBy('created_at', 'asc')
    .execute()

  return { ...order, items }
}
