import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  endpoint: process.env.CONTABO_S3_ENDPOINT ?? 'https://eu2.contabostorage.com',
  region: 'default',
  credentials: {
    accessKeyId: process.env.CONTABO_S3_ACCESS_KEY ?? process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CONTABO_S3_SECRET_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? ''
  },
  forcePathStyle: true
});

const BUCKET = process.env.CONTABO_S3_CONTENT_BUCKET ?? 'rbx-content';

export async function listKeys(prefix: string): Promise<string[]> {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (res.Contents ?? [])
    .map((o) => o.Key ?? '')
    .filter((k) => k.length > 0 && k.endsWith('.md'));
}

export async function getObject(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return await res.Body!.transformToString();
}

export function coverUrl(slug: string): string {
  const base =
    process.env.CONTABO_S3_PUBLIC_URL ?? 'https://eu2.contabostorage.com/rbx-content';
  return `${base}/blog/covers/${slug}.jpg`;
}
