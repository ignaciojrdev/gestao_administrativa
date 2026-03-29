// Garante que variáveis de ambiente existam antes de qualquer import de módulo
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.STOCK_SERVICE_URL = 'http://localhost:3002'
process.env.PORT = '3001'
