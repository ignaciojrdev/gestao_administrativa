import { db } from '../../db.js'
import { PAGINATION } from '../../constants/stock.constants.js'
import { availableQuantity } from '../../domain/stock.aggregate.js'
import { z } from 'zod'

export const ListStockSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  low_stock: z.coerce.boolean().optional(),
  low_stock_threshold: z.coerce.number().int().nonnegative().default(5),
})

export type ListStockInput = z.infer<typeof ListStockSchema>

export interface StockSummary {
  variant_id: string
  sku: string
  variant_name: string
  product_name: string
  quantity: number
  reserved: number
  available: number
  updated_at: Date
}

export interface PaginatedStock {
  data: StockSummary[]
  total: number
  page: number
  limit: number
}

export async function listStockQuery(input: ListStockInput): Promise<PaginatedStock> {
  const { page, limit, low_stock, low_stock_threshold } = input
  const offset = (page - 1) * limit

  let query = db
    .selectFrom('stock_projection as sp')
    .innerJoin('product_variants as pv', 'pv.id', 'sp.variant_id')
    .innerJoin('products as p', 'p.id', 'pv.product_id')
    .select([
      'sp.variant_id',
      'pv.sku',
      'pv.name as variant_name',
      'p.name as product_name',
      'sp.quantity',
      'sp.reserved',
      'sp.updated_at',
    ])
    .where('pv.deleted_at', 'is', null)

  if (low_stock) {
    query = query.where(
      db.fn.sql<number>('(sp.quantity - sp.reserved)'),
      '<=',
      low_stock_threshold,
    )
  }

  const countResult = await db
    .selectFrom('stock_projection')
    .select(db.fn.countAll<number>().as('total'))
    .executeTakeFirstOrThrow()

  const rows = await query.orderBy('sp.updated_at', 'desc').limit(limit).offset(offset).execute()

  const data: StockSummary[] = rows.map((row) => ({
    ...row,
    available: row.quantity - row.reserved,
  }))

  return { data, total: Number(countResult.total), page, limit }
}
