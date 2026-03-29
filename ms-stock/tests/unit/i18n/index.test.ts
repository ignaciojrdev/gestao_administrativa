import { describe, it, expect } from 'vitest'
import { t } from '../../../src/i18n/index.js'

describe('t()', () => {
  it('retorna a tradução para uma chave simples', () => {
    expect(t('errors.internal_error')).toBe('Erro interno do servidor')
  })

  it('interpola variável {{id}} corretamente', () => {
    const result = t('errors.product_not_found', { id: 'prod-123' })
    expect(result).toBe('Produto prod-123 não encontrado')
  })

  it('interpola variável {{variantId}} corretamente', () => {
    const result = t('errors.stock_not_found', { variantId: 'var-abc' })
    expect(result).toContain('var-abc')
  })

  it('interpola múltiplas variáveis', () => {
    const result = t('errors.insufficient_stock', { available: '10', requested: '20' })
    expect(result).toContain('10')
    expect(result).toContain('20')
  })

  it('interpola {{sku}} corretamente', () => {
    const result = t('errors.sku_already_exists', { sku: 'SKU-001' })
    expect(result).toContain('SKU-001')
  })

  it('retorna mensagem sem interpolação quando sem params', () => {
    const result = t('errors.database_url_required')
    expect(result).toBe('A variável de ambiente DATABASE_URL é obrigatória')
  })
})
