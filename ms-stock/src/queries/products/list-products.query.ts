import { db } from '../../db.js'
import { PAGINATION } from '../../constants/stock.constants.js'
import { z } from 'zod'

export const ListProductsSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().optional(),
})

export type ListProductsInput = z.infer<typeof ListProductsSchema>

export interface PaginatedProducts {
  data: Array<{ id: string; name: string; description: string | null; created_at: Date }>
  total: number
  page: number
  limit: number
}

export async function listProductsQuery(input: ListProductsInput): Promise<PaginatedProducts> {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  let query = db.selectFrom('products').selectAll().where('deleted_at', 'is', null)
  let countQuery = db.selectFrom('products').select(db.fn.countAll<number>().as('total')).where('deleted_at', 'is', null)

  if (search) {
    query = query.where('name', 'ilike', `%${search}%`)
    countQuery = countQuery.where('name', 'ilike', `%${search}%`)
  }

  const [data, countResult] = await Promise.all([
    query.orderBy('created_at', 'desc').limit(limit).offset(offset).execute(),
    countQuery.executeTakeFirstOrThrow(),
  ])

  return { data, total: Number(countResult.total), page, limit }
}
