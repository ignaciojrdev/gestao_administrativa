import { db } from '../../db.js'
import { PAGINATION } from '../../constants/stock.constants.js'
import { z } from 'zod'

export const StockHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
})

export type StockHistoryInput = z.infer<typeof StockHistorySchema>

export interface StockHistoryEntry {
  id: string
  type: string
  data: unknown
  created_at: Date
}

export interface PaginatedStockHistory {
  data: StockHistoryEntry[]
  total: number
  page: number
  limit: number
}

export async function getStockHistoryQuery(
  variantId: string,
  input: StockHistoryInput,
): Promise<PaginatedStockHistory> {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [rows, countResult] = await Promise.all([
    db
      .selectFrom('stock_events')
      .select(['id', 'type', 'data', 'created_at'])
      .where('aggregate_id', '=', variantId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom('stock_events')
      .select(db.fn.countAll<number>().as('total'))
      .where('aggregate_id', '=', variantId)
      .executeTakeFirstOrThrow(),
  ])

  return { data: rows, total: Number(countResult.total), page, limit }
}
