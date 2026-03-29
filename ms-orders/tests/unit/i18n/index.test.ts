import { describe, it, expect } from 'vitest'
import { t, tStatus } from '../../../src/i18n/index.js'
import { ORDER_STATUS } from '../../../src/constants/order.constants.js'

describe('t()', () => {
  it('retorna a tradução correta para uma chave simples', () => {
    expect(t('errors.internal_error')).toBe('Erro interno do servidor')
  })

  it('interpola variáveis no formato {{chave}}', () => {
    const result = t('errors.order_not_found', { id: '123' })
    expect(result).toBe('Pedido 123 não encontrado')
  })

  it('interpola múltiplas variáveis', () => {
    const result = t('errors.order_not_open', { id: 'abc', status: 'fechado' })
    expect(result).toBe('Pedido abc já está fechado')
  })

  it('interpola variáveis com nomes compostos', () => {
    const result = t('errors.item_not_found', { itemId: 'item-1', orderId: 'order-1' })
    expect(result).toContain('item-1')
    expect(result).toContain('order-1')
  })

  it('retorna string sem substituição quando sem params', () => {
    const result = t('errors.close_empty_order')
    expect(result).toBe('Não é possível fechar um pedido sem itens')
  })
})

describe('tStatus()', () => {
  it('traduz "open" para "aberto"', () => {
    expect(tStatus(ORDER_STATUS.OPEN)).toBe('aberto')
  })

  it('traduz "closed" para "fechado"', () => {
    expect(tStatus(ORDER_STATUS.CLOSED)).toBe('fechado')
  })

  it('traduz "cancelled" para "cancelado"', () => {
    expect(tStatus(ORDER_STATUS.CANCELLED)).toBe('cancelado')
  })
})
