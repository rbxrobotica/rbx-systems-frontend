import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { load as parseYaml } from 'js-yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const bucket = 'rbx-content';
const limit = 1024 * 1024;
export const targets = [
  ['site/pt-BR/home/index.md', '4f5a61d9a0c00ecbdcc060aacdf3ae49dc3870b965573bc391bcc9041287e72c'],
  [
    'site/pt-BR/solutions/index.md',
    '2bc9bea630cbf0ed49c7361f3b427dfd76f47ce054ea363e3f83b041d2a820dc'
  ],
  ['site/en/home/index.md', 'e654dec59be034fca08450211d7a6e1c0bfce7f93056a5c145644648f1b89d1a'],
  ['site/en/solutions/index.md', 'd139d52c42cc075acf53f6ef2c077910a9b18dbac9b0dd38b9a79adf40d4dac1']
];
export const sha256 = (body) => createHash('sha256').update(body).digest('hex');
export const headersMatch = (left = {}, right = {}) =>
  ['ContentType', 'CacheControl', 'ContentLanguage', 'ContentDisposition'].every(
    (name) => left[name] === right[name]
  );

export function readSnapshot(directory) {
  const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.version !== 1 || manifest.objects?.length !== 4) throw new Error('SnapshotShape');
  if (!Number.isFinite(Date.parse(manifest.captured_at))) throw new Error('SnapshotDate');
  return targets.map(([key], index) => {
    const entry = manifest.objects[index];
    if (entry.key !== key || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error('SnapshotScope');
    }
    const body = readFileSync(path.join(directory, key));
    if (body.length > limit || body.length !== entry.bytes || sha256(body) !== entry.sha256) {
      throw new Error('SnapshotIntegrity');
    }
    for (const [name, value] of Object.entries(entry.headers ?? {})) {
      if (
        !['ContentType', 'CacheControl', 'ContentLanguage', 'ContentDisposition'].includes(name)
      ) {
        throw new Error('SnapshotHeaders');
      }
      if (typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error('SnapshotHeaders');
    }
    return { ...entry, body };
  });
}

function reviewedBodies() {
  return targets.map(([key, expected]) => {
    const body = readFileSync(path.join(root, key.replace(/^site\//, 'site-content/')));
    if (sha256(body) !== expected) throw new Error('ReviewedSourceChanged');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body.toString('utf8'));
    const data = frontmatter && parseYaml(frontmatter[1]);
    for (const field of ['title', 'description', 'lead']) {
      if (typeof data?.[field] !== 'string' || !data[field].trim())
        throw new Error('InvalidFrontmatter');
    }
    return { key, body, sha256: expected };
  });
}

function credentials() {
  const get = (entry) =>
    execFileSync('pass', ['show', entry], {
      encoding: 'utf8',
      timeout: 6000,
      stdio: ['ignore', 'pipe', 'pipe']
    })
      .split('\n')[0]
      .trim();
  return { accessKeyId: get('rbx/s3/access-key'), secretAccessKey: get('rbx/s3/secret-key') };
}

async function getObject(client, key) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), {
    abortSignal: AbortSignal.timeout(10000)
  });
  if (response.ContentLength > limit) {
    response.Body.destroy();
    throw new Error('ObjectTooLarge');
  }
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of response.Body) {
      bytes += chunk.length;
      if (bytes > limit) throw new Error('ObjectTooLarge');
      chunks.push(chunk);
    }
  } finally {
    response.Body.destroy();
  }
  if (
    !response.ETag ||
    Object.keys(response.Metadata ?? {}).length ||
    response.ContentEncoding ||
    response.Expires
  ) {
    throw new Error('UnsupportedObjectMetadata');
  }
  const headers = {};
  for (const name of ['ContentType', 'CacheControl', 'ContentLanguage', 'ContentDisposition']) {
    if (response[name] !== undefined) headers[name] = response[name];
  }
  const body = Buffer.concat(chunks);
  return { key, body, bytes, sha256: sha256(body), etag: response.ETag, headers };
}

// Recheck all four bodies before the first write. Conditional PUT also protects
// each object against another writer between that read and its own update.
export async function guardedWrite(
  client,
  snapshot,
  replacements,
  read = getObject,
  restoring = false
) {
  const current = [];
  for (let index = 0; index < targets.length; index++) {
    const object = await read(client, targets[index][0]);
    if (
      object.sha256 !== snapshot[index].sha256 &&
      !(restoring && object.sha256 === targets[index][1])
    )
      throw new Error('LiveContentChanged');
    const expectedHeaders =
      object.sha256 === snapshot[index].sha256
        ? snapshot[index].headers
        : { ContentType: 'text/markdown' };
    if (!headersMatch(object.headers, expectedHeaders)) throw new Error('LiveHeadersChanged');
    current.push({ etag: object.etag });
  }
  for (let index = 0; index < targets.length; index++) {
    const replacement = replacements[index];
    console.log(
      JSON.stringify({
        event: 'object_write_attempt',
        key: targets[index][0],
        sha256: sha256(replacement.body)
      })
    );
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: targets[index][0],
        Body: replacement.body,
        ...replacement.headers,
        IfMatch: current[index].etag
      }),
      { abortSignal: AbortSignal.timeout(10000) }
    );
    console.log(
      JSON.stringify({
        event: 'object_written',
        key: targets[index][0],
        sha256: sha256(replacement.body)
      })
    );
  }
}

async function main(args) {
  const [mode, destination, ...extra] = args;
  const mutation = mode === 'publish' || mode === 'restore';
  if (
    !['capture', 'verify', 'check-live', 'publish', 'restore'].includes(mode) ||
    !destination ||
    (mutation
      ? extra.length !== 1 || extra[0] !== '--apply-four-reviewed-objects'
      : extra.length !== 0)
  ) {
    throw new Error(
      'Usage: capture|verify|check-live|publish|restore DIRECTORY [--apply-four-reviewed-objects]'
    );
  }
  const directory = path.resolve(destination);
  const reviewed = reviewedBodies();
  const snapshot = mode === 'capture' ? null : readSnapshot(directory);
  if (mode === 'publish') {
    const captured = JSON.parse(
      readFileSync(path.join(directory, 'manifest.json'), 'utf8')
    ).captured_at;
    const age = Date.now() - Date.parse(captured);
    if (age < 0 || age > 86400000) throw new Error('SnapshotStale');
  }
  if (mode === 'verify') {
    console.log(JSON.stringify({ event: 'snapshot_verified', objects: 4, s3_requests: 0 }));
    return;
  }
  const client = new S3Client({
    endpoint: 'https://eu2.contabostorage.com',
    region: 'default',
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: credentials()
  });
  try {
    if (mode === 'capture') {
      mkdirSync(directory, { mode: 0o700 });
      const objects = [];
      for (const [key] of targets) {
        const object = await getObject(client, key);
        const { body } = object;
        const entry = { key, bytes: object.bytes, sha256: object.sha256, headers: object.headers };
        mkdirSync(path.dirname(path.join(directory, key)), { recursive: true });
        writeFileSync(path.join(directory, key), body, { flag: 'wx', mode: 0o600 });
        objects.push(entry);
      }
      writeFileSync(
        path.join(directory, 'manifest.json'),
        JSON.stringify(
          {
            version: 1,
            captured_at: new Date().toISOString(),
            objects
          },
          null,
          2
        ) + '\n',
        { flag: 'wx', mode: 0o600 }
      );
      readSnapshot(directory);
      console.log(JSON.stringify({ event: 'snapshot_captured', objects: 4, s3_requests: 4 }));
    } else if (mode === 'check-live') {
      for (const entry of snapshot) {
        const object = await getObject(client, entry.key);
        if (object.sha256 !== entry.sha256 || !headersMatch(object.headers, entry.headers))
          throw new Error('LiveContentChanged');
      }
      console.log(JSON.stringify({ event: 'live_matches_snapshot', objects: 4, s3_requests: 4 }));
    } else if (mode === 'publish') {
      await guardedWrite(
        client,
        snapshot,
        reviewed.map((entry) => ({
          ...entry,
          headers: { ContentType: 'text/markdown' }
        }))
      );
      for (const entry of reviewed) {
        const object = await getObject(client, entry.key);
        if (
          object.sha256 !== entry.sha256 ||
          !headersMatch(object.headers, { ContentType: 'text/markdown' })
        )
          throw new Error('WriteReadbackMismatch');
      }
      console.log(JSON.stringify({ event: 'publication_verified', objects: 4, s3_requests: 12 }));
    } else {
      await guardedWrite(client, snapshot, snapshot, getObject, true);
      for (const entry of snapshot) {
        const object = await getObject(client, entry.key);
        if (object.sha256 !== entry.sha256 || !headersMatch(object.headers, entry.headers))
          throw new Error('RestoreReadbackMismatch');
      }
      console.log(JSON.stringify({ event: 'restore_verified', objects: 4, s3_requests: 12 }));
    }
  } finally {
    client.destroy();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    // SDK and subprocess exceptions can contain request or credential details.
    const known = [
      'SnapshotShape',
      'SnapshotScope',
      'SnapshotDate',
      'SnapshotStale',
      'SnapshotIntegrity',
      'SnapshotHeaders',
      'ReviewedSourceChanged',
      'InvalidFrontmatter',
      'ObjectTooLarge',
      'UnsupportedObjectMetadata',
      'LiveContentChanged',
      'LiveHeadersChanged',
      'UnexpectedLiveContent',
      'WriteReadbackMismatch',
      'RestoreReadbackMismatch'
    ];
    console.error(
      JSON.stringify({
        event: 'stopped',
        reason: known.includes(error.message)
          ? error.message
          : [
                'PreconditionFailed',
                'ConditionalRequestConflict',
                'NotImplemented',
                'AbortError',
                'TimeoutError'
              ].includes(error.name)
            ? error.name
            : 'OperationFailed'
      })
    );
    process.exitCode = 1;
  });
}
