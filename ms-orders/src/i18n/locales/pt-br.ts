export const ptBR = {
  errors: {
    order_not_found: 'Pedido {{id}} não encontrado',
    order_not_open: 'Pedido {{id}} já está {{status}}',
    item_not_found: 'Item {{itemId}} não encontrado no pedido {{orderId}}',
    close_empty_order: 'Não é possível fechar um pedido sem itens',
    database_url_required: 'A variável de ambiente DATABASE_URL é obrigatória',
    internal_error: 'Erro interno do servidor',
    validation_error: 'Erro de validação',
  },
  order_status: {
    open: 'aberto',
    closed: 'fechado',
    cancelled: 'cancelado',
  },
} as const
