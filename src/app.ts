import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { HttpStatusCode } from 'axios'
import { getConfig } from '@/config'
import { schemas, routes, setErrorHandler } from '@/http'

interface BuildOpts extends FastifyServerOptions {
  exposeDocs?: boolean
}
const { version, keepAliveTimeout, headersTimeout } = getConfig()

export default function build(opts: BuildOpts = {}): FastifyInstance {
  const app = fastify(opts)

  app.register(fastifyMultipart, {
    limits: {
      fields: 10,
      files: 1,
    },
    throwFileSizeLimit: false,
  })
  app.addContentTypeParser('*', function (request, payload, done) {
    done(null)
  })
  app.server.keepAliveTimeout = keepAliveTimeout * 1000
  app.server.headersTimeout = headersTimeout * 1000

  app.addSchema(schemas.authSchema)
  app.addSchema(schemas.errorSchema)

  app.register(routes.bucket, { prefix: 'bucket' })

  setErrorHandler(app)

  app.get('/version', (_, res) => res.send({ version }))
  app.get('/status', async (_, res) =>
    res.status(HttpStatusCode.Ok).send({ status: HttpStatusCode.Ok })
  )

  return app
}
