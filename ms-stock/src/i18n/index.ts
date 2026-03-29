import { ptBR } from './locales/pt-br.js'

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
