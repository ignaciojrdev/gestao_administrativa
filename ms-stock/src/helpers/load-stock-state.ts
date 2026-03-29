import { db } from '../db.js'
import { rebuildStockState } from '../domain/stock.aggregate.js'
import type { StockState } from '../domain/stock.aggregate.js'

/**
 * Busca os eventos de uma variante e reconstrói o estado atual do estoque.
 * Retorna null se nenhum evento existir ainda (variante sem movimentação).
 */
export async function loadStockState(variantId: string): Promise<StockState | null> {
  const events = await db
    .selectFrom('stock_events')
    .selectAll()
    .where('aggregate_id', '=', variantId)
    .orderBy('created_at', 'asc')
    .execute()

  if (events.length === 0) return null

  return rebuildStockState(events)
}
