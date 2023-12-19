import { FastifyInstance } from "fastify";
import { storage } from "@/http/plugins/storage";
import getAllBuckets from './get-all-buckets'

export default async function routes(fastify: FastifyInstance) {
    // fastify.register(storage)
    fastify.register(getAllBuckets)
}