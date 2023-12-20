import { DatabaseError } from 'pg'
import { FastifyError } from '@fastify/error'
import { FastifyInstance } from 'fastify'
import { HttpStatusCode } from 'axios'

/**
 * The global error handler for all the uncaught exceptions within a request.
 * We try our best to display meaningful information to our users
 * and log any error that occurs
 * @param app
 */

export function setErrorHandler(app: FastifyInstance) {
  app.setErrorHandler<Error>((error, request, reply) => {
    // reply.executionError = error

    // database error
    const databaseErrorLogs = [
      'remaining connection slots are reserved for non-replication superuser connections',
      'no more connections allowed',
      'sorry, too many clients already',
      'server login has been failing, try again later',
    ]
    if (
      error instanceof DatabaseError &&
      databaseErrorLogs.some((msg) => (error as DatabaseError).message.includes(msg))
    ) {
      return reply.status(HttpStatusCode.TooManyRequests).send({
        status_code: HttpStatusCode.TooManyRequests,
        error: 'too_many_connections',
        message: 'Too many connections issued to the database',
      })
    }
    // fastify error
    if ('statusCode' in error) {
      const err = error as FastifyError
      return reply.status((error as any).statusCode || HttpStatusCode.InternalServerError).send({
        status_code: err.statusCode,
        error: err.name,
        message: err.message,
      })
    }
    // unknown error
    reply.status(HttpStatusCode.InternalServerError).send({
      status_code: HttpStatusCode.InternalServerError,
      error: 'Internal',
      message: 'Internal Server Error',
    })
  })
}
