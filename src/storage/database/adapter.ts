import { Bucket } from "@/storage/schemas/bucket";

export interface Database {
    listBuckets(columns: string): Promise<Bucket[]>
}