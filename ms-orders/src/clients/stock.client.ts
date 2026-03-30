import { BusinessError } from '../helpers/errors.js'
import { t } from '../i18n/index.js'

if (!process.env.STOCK_SERVICE_URL) {
  throw new Error(t('errors.stock_url_required'))
}

const BASE_URL = process.env.STOCK_SERVICE_URL.replace(/\/$/, '')

// ─── Tipos das chamadas ───────────────────────────────────────────────────────

interface ReserveParams {
  variantId: string
  quantity: number
  orderId: string
  idempotencyKey: string
}

interface ReleaseParams {
  variantId: string
  quantity: number
  orderId: string
  idempotencyKey: string
}

interface ConsumeParams {
  variantId: string
  quantity: number
  orderId: string
  idempotencyKey: string
}

// ─── Helper interno ───────────────────────────────────────────────────────────

async function post(path: string, body: object): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 409) return // idempotência: já processado, tudo ok

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    const error = (payload as { error?: unknown }).error
    const message = typeof error === 'string' ? error : JSON.stringify(error) ?? res.statusText
    throw new BusinessError(message)
  }
}

// ─── API pública do cliente ───────────────────────────────────────────────────

export const stockClient = {
  async reserve(params: ReserveParams): Promise<void> {
    try {
      await post(`/stock/${params.variantId}/reserve`, {
        quantity: params.quantity,
        order_id: params.orderId,
        idempotency_key: params.idempotencyKey,
      })
    } catch (err) {
      if (err instanceof BusinessError) throw err
      throw new BusinessError(t('errors.stock_reserve_failed', { variantId: params.variantId }))
    }
  },

  async release(params: ReleaseParams): Promise<void> {
    try {
      await post(`/stock/${params.variantId}/release`, {
        quantity: params.quantity,
        order_id: params.orderId,
        idempotency_key: params.idempotencyKey,
      })
    } catch (err) {
      if (err instanceof BusinessError) throw err
      throw new BusinessError(t('errors.stock_release_failed', { variantId: params.variantId }))
    }
  },

  async consume(params: ConsumeParams): Promise<void> {
    try {
      await post(`/stock/${params.variantId}/consume`, {
        quantity: params.quantity,
        order_id: params.orderId,
        idempotency_key: params.idempotencyKey,
      })
    } catch (err) {
      if (err instanceof BusinessError) throw err
      throw new BusinessError(t('errors.stock_consume_failed', { variantId: params.variantId }))
    }
  },
}
