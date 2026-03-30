import { db } from '../../db.js'
import { NotFoundError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'

export interface ProductDetail {
  id: string
  name: string
  description: string | null
  created_at: Date
  variants: Array<{ id: string; name: string; sku: string; price: number; created_at: Date }>
}

export async function getProductQuery(productId: string): Promise<ProductDetail> {
  const product = await db
    .selectFrom('products')
    .selectAll()
    .where('id', '=', productId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!product) {
    throw new NotFoundError(t('errors.product_not_found', { id: productId }))
  }

  const variants = await db
    .selectFrom('product_variants')
    .select(['id', 'name', 'sku', 'price', 'created_at'])
    .where('product_id', '=', productId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'asc')
    .execute()

  return { ...product, variants }
}
