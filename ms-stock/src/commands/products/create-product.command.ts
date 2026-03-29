import { randomUUID } from 'crypto'
import { db } from '../../db.js'
import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>

export async function createProductCommand(
  input: CreateProductInput,
): Promise<{ id: string }> {
  const id = randomUUID()

  await db
    .insertInto('products')
    .values({ id, name: input.name, description: input.description ?? null })
    .execute()

  return { id }
}
