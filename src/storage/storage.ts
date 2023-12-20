import { getConfig } from '@/config'
import { StorageBackendAdapter } from '@/storage/backend'
import { Database } from '@/storage/database'

const { urlLengthLimit, globalS3Bucket } = getConfig()

export class Storage {
  constructor(
    public readonly backend: StorageBackendAdapter,
    public readonly db: Database
  ) {}

  from(bucketId: string) {}
  findBucket() {}
  listBuckets(columns = 'id') {
    return this.db.listBuckets(columns)
  }
}
