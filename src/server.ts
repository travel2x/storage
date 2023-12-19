import { FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

import build from "@/app";
import { getConfig } from "@/config";
import { logger, logSchema } from "@/monitoring";

function main() {
  const { port, host } = getConfig();
  const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = build({
    logger,
    disableRequestLogging: true,
  });
  app.listen({ port, host }, (err, address) => {
    if (err) {
      logSchema.error(logger, `Server failed to start`, {
        type: "serverStartError",
        error: err,
      });
      process.exit(1);
    }
    logger.info(`Server listening at ${address}`);
  });

  process.on('uncaughtException', (e) => {
    logSchema.error(logger, 'uncaught exception', {
      type: 'uncaughtException',
      error: e,
    })
    process.exit(1)
  });

  process.on('SIGTERM', async () => {
    try {
      await app.close()
    //   await Promise.allSettled([Queue.stop(), TenantConnection.stop()])
      process.exit(0)
    } catch (e) {
      logSchema.error(logger, 'shutdown error', {
        type: 'SIGTERM',
        error: e,
      })
      process.exit(1)
    }
  });
}

main();
