import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

// ─── products ────────────────────────────────────────────────────────────────

export interface ProductsTable {
  id: Generated<string>
  name: string
  description: string | null
  deleted_at: Date | null
  created_at: Generated<Date>
}

export type Product = Selectable<ProductsTable>
export type NewProduct = Insertable<ProductsTable>
export type ProductUpdate = Updateable<ProductsTable>

// ─── product_variants ────────────────────────────────────────────────────────

export interface ProductVariantsTable {
  id: Generated<string>
  product_id: string
  name: string
  sku: string
  price: number
  deleted_at: Date | null
  created_at: Generated<Date>
}

export type ProductVariant = Selectable<ProductVariantsTable>
export type NewProductVariant = Insertable<ProductVariantsTable>
export type ProductVariantUpdate = Updateable<ProductVariantsTable>

// ─── stock_events ────────────────────────────────────────────────────────────

export interface StockEventsTable {
  id: Generated<string>
  aggregate_id: string
  type: string
  data: unknown
  created_at: Generated<Date>
}

export type StockEvent = Selectable<StockEventsTable>
export type NewStockEvent = Insertable<StockEventsTable>

// ─── stock_projection ────────────────────────────────────────────────────────

export interface StockProjectionTable {
  variant_id: string
  quantity: number
  reserved: number
  updated_at: Generated<Date>
}

export type StockProjection = Selectable<StockProjectionTable>

// ─── processed_events ────────────────────────────────────────────────────────

export interface ProcessedEventsTable {
  event_id: string
  processed_at: Generated<Date>
}

export type ProcessedEvent = Selectable<ProcessedEventsTable>

// ─── Database ────────────────────────────────────────────────────────────────

export interface Database {
  products: ProductsTable
  product_variants: ProductVariantsTable
  stock_events: StockEventsTable
  stock_projection: StockProjectionTable
  processed_events: ProcessedEventsTable
}
