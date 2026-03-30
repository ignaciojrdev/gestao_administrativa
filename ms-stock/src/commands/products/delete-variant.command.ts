import { db } from '../../db.js'
import { NotFoundError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'

export async function deleteVariantCommand(productId: string, variantId: string): Promise<void> {
  const variant = await db
    .selectFrom('product_variants')
    .select('id')
    .where('id', '=', variantId)
    .where('product_id', '=', productId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!variant) {
    throw new NotFoundError(t('errors.variant_not_found', { id: variantId }))
  }

  await db
    .updateTable('product_variants')
    .set({ deleted_at: new Date() })
    .where('id', '=', variantId)
    .execute()
}
