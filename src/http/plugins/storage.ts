import fastifyPlugin from "fastify-plugin";
import { Storage } from "@/storage";
import { getConfig } from "@/config";
import { StorageBackendAdapter } from "@/storage/backend";

declare module "fastify" {
  interface FastifyRequest {
    storage: Storage;
    backend: StorageBackendAdapter
  }
}

const { storageBackendType } = getConfig();

export const storage = fastifyPlugin(async (fastify) => {
    // const storageBackend = createStorageBacken(storageBackendType)

});
