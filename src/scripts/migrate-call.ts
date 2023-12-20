import dotenv from 'dotenv'
import { migrate } from '@/database'
dotenv.config()
;(async () => {
  await migrate.runMigrations()
})()
