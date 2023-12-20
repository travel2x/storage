import pg, {DatabaseError} from 'pg';
import {Knex, knex, KnexTimeoutError} from 'knex'
import TTLCache from "@isaacs/ttlcache";
import { JwtPayload } from 'jsonwebtoken'
import retry from 'async-retry'

import {getConfig} from "@/config";


// https://github.com/knex/knex/issues/387#issuecomment-51554522
pg.types.setTypeParser(20, 'text', parseInt);

interface TenantConnectionOptions {
    user: User
    superUser: User

    tenantId: string
    dbUrl: string
    isExternalPool?: boolean
    maxConnections: number
    headers?: Record<string, string | undefined | string[]>
    method?: string
    path?: string
}

export interface User {
    jwt: string
    payload: { role?: string } & JwtPayload
}

const { databaseMaxConnections, databaseConnectionTimeout, databaseFreePoolAfterInactivity, databaseSSLRootCert } = getConfig()
const searchPath = ['storage', 'public', 'extensions']

export const connections = new TTLCache<string, Knex>({
    max: 1,
    ttl: Infinity,
    dispose: async (pool) => {
        if(!pool) return
        await pool.destroy()
        pool.client.removeAllListeners()
    }
})

export class TenantConnection {
    public readonly role: string
    protected constructor(
        protected  readonly pool: Knex,
        protected  readonly  options: TenantConnectionOptions
    ) {
        this.role = options.user.payload.role || 'anon'
    }

    static stop() {
        const promises: Promise<void>[] = []
        for (const connection of connections) {
            const [connectionString, pool] = connection;
            promises.push(pool.destroy())
            connections.delete(connectionString)
        }
        return Promise.allSettled(promises)
    }

    static async create(options: TenantConnectionOptions) {
        const connectionString = options.dbUrl
        let knexPool = connections.get(connectionString)
        if (knexPool) {
            return new this(knexPool, options)
        }
        const isExternalPool = Boolean(options.isExternalPool)
        knexPool = knex({
            client: 'pg',
            searchPath: isExternalPool ? undefined : searchPath,
            pool: {
                min: 0,
                max: isExternalPool ? 1 : options.maxConnections || databaseMaxConnections,
                acquireTimeoutMillis: databaseConnectionTimeout,
                idleTimeoutMillis: isExternalPool ? 100 : databaseFreePoolAfterInactivity,
                reapIntervalMillis: isExternalPool ? 110 : undefined,
            },
            connection: {
                connectionString,
                ...this.sslSettings(),
            },
            acquireConnectionTimeout: databaseConnectionTimeout,
        })

        // DbActivePool.inc({ is_external: isExternalPool.toString() })
        knexPool.client.pool.on('createSuccess', () => {
            // DbActiveConnection.inc({ is_external: isExternalPool.toString() })
        })
        knexPool.client.pool.on('destroySuccess', () => {
            // DbActiveConnection.dec({ is_external: isExternalPool.toString()})
        })
        knexPool.client.pool.on('poolDestroySuccess', () => {
            // DbActivePool.dec({ is_external: isExternalPool.toString() })
        })

        if(!isExternalPool) {
            connections.set(connectionString, knexPool)
        }
        return  new this(knexPool, options)
    }

    protected static sslSettings() {
        if(databaseSSLRootCert) {
            return {
                ssl: { ca: databaseSSLRootCert }
            }
        }
        return {}
    }

    async dispose() {
        if(this.options.isExternalPool) {
            await this.pool.destroy()
            this.pool.client.removeAllListeners()
        }
    }

    async transaction(instance?: Knex) {
        try {
            const retryOptions = {
                minTimeout: 50,
                maxTimeout: 200,
                maxRetryTime: 3000,
                retries: 10,
            }
            const tnx = await retry(async (bail) => {
                try {
                    const pool = instance || this.pool
                    return await pool.transaction()
                } catch (error) {
                    if (
                        error instanceof DatabaseError &&
                        error.code === '08P01' &&
                        error.message.includes('no more connections allowed')
                    ) {
                        throw error
                    }
                    bail(error as Error)
                    return
                }
            }, retryOptions)
            if (!tnx) {
                // throw new StorageBackendError('Could not create transaction', 500, 'transaction_failed')
                throw new Error('Could not create transaction')
            }
            if(!instance  && this.options.isExternalPool) {
                await tnx.raw(`SELECT set_config('search_path', ?, true)`, [searchPath.join(', ')])
            }
            return tnx
        } catch (error) {
            if(error instanceof KnexTimeoutError) {
                // throw StorageBackendError.withStatusCode('database_timeout', 544, 'The connection to the database timed out',error)
            }
            throw error
        }
    }

    transactionProvider(instance?: Knex): Knex.TransactionProvider {
        return () => this.transaction(instance)
    }

    asSuperUser() {
        return new TenantConnection(this.pool, {
            ...this.options,
            user: this.options.superUser
        })
    }

    async setScope(tnx: Knex) {
        const headers = JSON.stringify(this.options.headers || {})
        await tnx.raw(
            `
            SELECT
              set_config('role', ?, true),
              set_config('request.jwt.claim.role', ?, true),
              set_config('request.jwt', ?, true),
              set_config('request.jwt.claim.sub', ?, true),
              set_config('request.jwt.claims', ?, true),
              set_config('request.headers', ?, true),
              set_config('request.method', ?, true),
              set_config('request.path', ?, true);
            `,
            [
                this.role,
                this.role,
                this.options.user.jwt,
                this.options.user.payload.sub,
                JSON.stringify(this.options.user.payload),
                headers,
                this.options.method || 'GET',
                this.options.path || '/',
            ]
        )
    }
}