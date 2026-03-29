import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { ordersRoute } from './routes/orders.route.js'
import { AppError } from './helpers/errors.js'
import { t } from './i18n/index.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(sensible)
  app.register(ordersRoute)

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }

    return reply.status(500).send({ error: t('errors.internal_error') })
  })

  return app
}
