import { randomUUID } from 'crypto'
import { db } from '../../db.js'
import { NotFoundError, ConflictError } from '../../helpers/errors.js'
import { t } from '../../i18n/index.js'
import { z } from 'zod'

export const CreateVariantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  price: z.number().nonnegative().default(0),
})

export type CreateVariantInput = z.infer<typeof CreateVariantSchema>

export async function createVariantCommand(
  productId: string,
  input: CreateVariantInput,
): Promise<{ id: string }> {
  const product = await db
    .selectFrom('products')
    .select('id')
    .where('id', '=', productId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!product) {
    throw new NotFoundError(t('errors.product_not_found', { id: productId }))
  }

  const existing = await db
    .selectFrom('product_variants')
    .select('id')
    .where('sku', '=', input.sku)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (existing) {
    throw new ConflictError(t('errors.sku_already_exists', { sku: input.sku }))
  }

  const id = randomUUID()

  await db
    .insertInto('product_variants')
    .values({ id, product_id: productId, name: input.name, sku: input.sku, price: input.price, deleted_at: null })
    .execute()

  return { id }
}
