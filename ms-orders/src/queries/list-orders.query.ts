import { db } from '../db.js'
import { ORDER_STATUS, PAGINATION } from '../constants/order.constants.js'
import type { OrderStatus } from '../constants/order.constants.js'
import { z } from 'zod'

export const ListOrdersSchema = z.object({
  status: z.enum([ORDER_STATUS.OPEN, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED]).optional(),
  table_number: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
})

export type ListOrdersInput = z.infer<typeof ListOrdersSchema>

export interface OrderSummary {
  id: string
  status: OrderStatus
  table_number: number | null
  total: number
  created_at: Date
  updated_at: Date
}

export interface PaginatedOrders {
  data: OrderSummary[]
  total: number
  page: number
  limit: number
}

export async function listOrdersQuery(input: ListOrdersInput): Promise<PaginatedOrders> {
  const { status, table_number, page, limit } = input
  const offset = (page - 1) * limit

  let query = db.selectFrom('orders').selectAll()
  let countQuery = db.selectFrom('orders').select(db.fn.countAll<number>().as('total'))

  if (status) {
    query = query.where('status', '=', status)
    countQuery = countQuery.where('status', '=', status)
  }

  if (table_number) {
    query = query.where('table_number', '=', table_number)
    countQuery = countQuery.where('table_number', '=', table_number)
  }

  const [data, countResult] = await Promise.all([
    query.orderBy('created_at', 'desc').limit(limit).offset(offset).execute(),
    countQuery.executeTakeFirstOrThrow(),
  ])

  return {
    data,
    total: Number(countResult.total),
    page,
    limit,
  }
}
