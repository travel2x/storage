import fastifyPlugin from 'fastify-plugin'
import { createResponse } from '@/http/generic-routes'
import { getJwtSecret, getOwner } from '@/bcrypt'
import { HttpStatusCode } from 'axios'

declare module 'fastify' {
  interface FastifyRequest {
    jwt: string
    owner?: string
  }
}

export const jwt = fastifyPlugin(async (fastify) => {
  fastify.decorateRequest('jwt', '')
  fastify.addHook('preHandler', async (request, reply) => {
    request.jwt = (request.headers.authorization || '').substring('Bearer '.length)

    const jwtSecret = await getJwtSecret()
    try {
      const owner = await getOwner(request.jwt, jwtSecret)
      request.owner = owner
    } catch (err: any) {
      request.log.error({ error: err }, 'unable to get owner')
      return reply
        .status(HttpStatusCode.BadRequest)
        .send(createResponse(err.message, '400', err.message))
    }
  })
})
