/**
 * Object Storage store — the ONLY module aware of the S3-compatible API.
 * Part of the Content Gateway (see ADR-0002). Server-only: lives under
 * $lib/server so it can never be imported into a client bundle.
 */
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const BUCKET = process.env.CONTABO_S3_CONTENT_BUCKET ?? 'rbx-content';

const client = new S3Client({
  endpoint: process.env.CONTABO_S3_ENDPOINT ?? 'https://eu2.contabostorage.com',
  region: 'default',
  credentials: {
    accessKeyId: process.env.CONTABO_S3_ACCESS_KEY ?? process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CONTABO_S3_SECRET_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? ''
  },
  forcePathStyle: true
});

export interface TextObject {
  body: string;
  etag?: string;
}

export interface ByteObject {
  bytes: Uint8Array;
  contentType?: string;
  etag?: string;
}

/** Get a text object. Returns null when the key does not exist. */
export async function getTextObject(key: string): Promise<TextObject | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    return { body: await res.Body.transformToString(), etag: res.ETag };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Get a binary object (assets/covers). Returns null when the key does not exist. */
export async function getByteObject(key: string): Promise<ByteObject | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { bytes, contentType: res.ContentType, etag: res.ETag };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** List all object keys under a prefix (paginated). */
export async function listObjectKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token })
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) keys.push(o.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

function isNotFound(err: unknown): boolean {
  const name = (err as { name?: string })?.name;
  return name === 'NoSuchKey' || name === 'NotFound';
}
