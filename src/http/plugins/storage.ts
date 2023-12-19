import fastifyPlugin from "fastify-plugin";
import { Storage } from "@/storage";
import { getConfig } from "@/config";

declare module "fastify" {
  interface FastifyRequest {
    storage: Storage;
    //   backend: StorageBackendAdapter
  }
}

const { storageBackendType } = getConfig();

export const storage = fastifyPlugin(async (fastify) => {
    // const storageBackend = createStorageBackend(storageBackendType)

});
