import { ptBR } from './locales/pt-br.js'
import { ORDER_STATUS } from '../constants/order.constants.js'
import type { OrderStatus } from '../constants/order.constants.js'

// ─── Tipo que deriva todos os caminhos dot-notation válidos da tradução ───────

type DotPath<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPath<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type TranslationKey = DotPath<typeof ptBR>

// ─── Resolve o valor de um caminho dot-notation no objeto de traduções ────────

function resolvePath(obj: unknown, path: string): string {
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], obj) as string
}

// ─── Interpolação de variáveis no formato {{chave}} ──────────────────────────

function interpolate(message: string, params?: Record<string, string>): string {
  if (!params) return message
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    message,
  )
}

// ─── Função principal de tradução ─────────────────────────────────────────────

export function t(key: TranslationKey, params?: Record<string, string>): string {
  const message = resolvePath(ptBR, key)
  return interpolate(message, params)
}

// ─── Traduz o status de um pedido para pt-br ─────────────────────────────────

const statusTranslations: Record<OrderStatus, string> = {
  [ORDER_STATUS.OPEN]: ptBR.order_status.open,
  [ORDER_STATUS.CLOSED]: ptBR.order_status.closed,
  [ORDER_STATUS.CANCELLED]: ptBR.order_status.cancelled,
}

export function tStatus(status: OrderStatus): string {
  return statusTranslations[status]
}
