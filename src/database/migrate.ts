import { Client, ClientConfig } from 'pg'
import { migrate } from 'postgres-migrations'
import { getConfig } from '@/config'

const { databaseSSLRootCert, databaseURL } = getConfig()

export async function runMigrations(): Promise<void> {
  let ssl: ClientConfig['ssl']
  if (databaseSSLRootCert) {
    ssl = { ca: databaseSSLRootCert }
  }
  try {
    await connectAndMigrate(databaseURL, './migrations', ssl)
    console.log('Migrations completed successfully')
  } catch (e) {
    console.error('Running migrations', e)
  }
}

async function connectAndMigrate(
  connectionString: string,
  migrationsDirectory: string,
  ssl?: ClientConfig['ssl']
): Promise<void> {
  const config: ClientConfig = {
    connectionString,
    ssl,
    connectionTimeoutMillis: 10_000,
    options: '-c search_path=storage,public',
  }
  const client = new Client(config)
  try {
    await client.connect()
    await migrate({ client }, migrationsDirectory)
  } finally {
    await client.end()
  }
}
