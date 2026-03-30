import { db } from '../../db.js'
import { NotFoundError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'

export async function deleteProductCommand(productId: string): Promise<void> {
  const product = await db
    .selectFrom('products')
    .select('id')
    .where('id', '=', productId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!product) {
    throw new NotFoundError(t('errors.product_not_found', { id: productId }))
  }

  const now = new Date()

  await db
    .updateTable('products')
    .set({ deleted_at: now })
    .where('id', '=', productId)
    .execute()

  await db
    .updateTable('product_variants')
    .set({ deleted_at: now })
    .where('product_id', '=', productId)
    .where('deleted_at', 'is', null)
    .execute()
}
