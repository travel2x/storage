import { FastifyInstance } from "fastify";
import { storage, jwt } from "@/http/plugins";
import getAllBuckets from './get-all-buckets'

export default async function routes(fastify: FastifyInstance) {
    fastify.register(jwt)
    fastify.register(storage)

    fastify.register(getAllBuckets)
}