export const ptBR = {
  errors: {
    database_url_required: 'A variável de ambiente DATABASE_URL é obrigatória',
    internal_error: 'Erro interno do servidor',
    product_not_found: 'Produto {{id}} não encontrado',
    variant_not_found: 'Variante {{id}} não encontrada',
    sku_already_exists: 'O SKU {{sku}} já está em uso',
    stock_not_found: 'Estoque para a variante {{variantId}} não encontrado',
    insufficient_stock: 'Estoque insuficiente: disponível {{available}}, solicitado {{requested}}',
    insufficient_reserved: 'Reserva insuficiente: reservado {{reserved}}, solicitado {{requested}}',
    stock_out_exceeds_available: 'Saída de {{requested}} excede o disponível ({{available}})',
    duplicate_event: 'Evento {{eventId}} já foi processado',
  },
} as const
