import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import { productsRoute } from './routes/products.route.js'
import { stockRoute } from './routes/stock.route.js'
import { healthRoute } from './routes/health.route.js'
import { AppError } from './helpers/errors.js'
import { t } from './i18n/index.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(sensible)
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ error: t('errors.rate_limit_exceeded') }),
  })
  app.register(healthRoute)
  app.register(productsRoute)
  app.register(stockRoute)

  app.setErrorHandler((error, _request, reply) => {
    if ((error as any).statusCode === 429) {
      return reply.status(429).send({ error: t('errors.rate_limit_exceeded') })
    }

    app.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }

    return reply.status(500).send({ error: t('errors.internal_error') })
  })

  return app
}
