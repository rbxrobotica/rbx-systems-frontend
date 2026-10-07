import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  guardedWrite,
  conditionalETag,
  headersMatch,
  readSnapshot,
  sha256,
  targets
} from './site-content-recovery.mjs';
import { S3Client } from '@aws-sdk/client-s3';

test('conditional ETag preserves the token and refuses wildcard, weak and malformed conditions', () => {
  const etagValue = '1234567890abcdef1234567890abcdef';
  assert.equal(conditionalETag(`"${etagValue}"`), etagValue);
  assert.equal(conditionalETag(etagValue), etagValue);
  for (const invalid of [
    '*',
    '',
    '""',
    'W/"etag"',
    'etag\r\nother',
    '"unfinished',
    'nested"quote',
    null
  ]) {
    assert.throws(() => conditionalETag(invalid), /InvalidETag/);
  }
});

test('SDK sends the normalized If-Match token on every bounded PUT without a network', async (t) => {
  t.mock.method(console, 'log', () => {});
  const sent = [];
  const etagValue = '1234567890abcdef1234567890abcdef';
  const client = new S3Client({
    endpoint: 'http://127.0.0.1',
    region: 'us-east-1',
    maxAttempts: 1,
    credentials: { accessKeyId: 'fixture', secretAccessKey: 'fixture' },
    requestHandler: {
      handle: async (request) => {
        sent.push(request.headers['if-match']);
        return {
          response: { statusCode: 200, headers: { etag: 'fixture' }, body: new Uint8Array() }
        };
      },
      destroy: () => {}
    }
  });
  try {
    await guardedWrite(
      client,
      targets.map(([key]) => ({ key, sha256: 'old' })),
      targets.map(() => ({ body: Buffer.from('reviewed'), headers: {} })),
      async () => ({ sha256: 'old', etag: `"${etagValue}"` })
    );
    assert.deepEqual(sent, [etagValue, etagValue, etagValue, etagValue]);
  } finally {
    client.destroy();
  }
});

function fixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'site-recovery-test-'));
  const objects = targets.map(([key], index) => {
    const body = Buffer.from(`previous public text ${index}`);
    mkdirSync(path.dirname(path.join(directory, key)), { recursive: true });
    writeFileSync(path.join(directory, key), body);
    return {
      key,
      sha256: sha256(body),
      bytes: body.length,
      headers: { ContentType: 'text/markdown' }
    };
  });
  const manifest = { version: 1, captured_at: '2026-10-07T00:00:00Z', objects };
  const save = () => writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  save();
  return { directory, manifest, save };
}

test('snapshot refuses changed bytes, extra keys, duplicate keys and extra headers', () => {
  const f = fixture();
  try {
    assert.equal(readSnapshot(f.directory).length, 4);
    f.manifest.objects[1].key = f.manifest.objects[0].key;
    f.save();
    assert.throws(() => readSnapshot(f.directory), /SnapshotScope/);
    f.manifest.objects[1].key = targets[1][0];
    f.manifest.objects[0].headers.Metadata = 'unreviewed';
    f.save();
    assert.throws(() => readSnapshot(f.directory), /SnapshotHeaders/);
    delete f.manifest.objects[0].headers.Metadata;
    f.manifest.objects.push({ key: 'blog/posts/unrelated.md' });
    f.save();
    assert.throws(() => readSnapshot(f.directory), /SnapshotShape/);
    f.manifest.objects.pop();
    f.save();
    writeFileSync(path.join(f.directory, targets[0][0]), 'tampered');
    assert.throws(() => readSnapshot(f.directory), /SnapshotIntegrity/);
  } finally {
    rmSync(f.directory, { recursive: true });
  }
});

test('drift in the last read prevents every write', async () => {
  let writes = 0;
  const snapshot = targets.map(([key]) => ({ key, sha256: 'old' }));
  const client = {
    send: async () => {
      writes++;
    }
  };
  const read = async (_client, key) => ({
    sha256: key === targets[3][0] ? 'other-writer' : 'old',
    etag: 'v1'
  });
  await assert.rejects(guardedWrite(client, snapshot, [], read), /LiveContentChanged/);
  assert.equal(writes, 0);
});

test('invalid ETag in the fourth GET prevents every PUT', async () => {
  let writes = 0;
  const snapshot = targets.map(([key]) => ({ key, sha256: 'old' }));
  await assert.rejects(
    guardedWrite(
      {
        send: async () => {
          writes++;
        }
      },
      snapshot,
      [],
      async (_client, key) => ({ sha256: 'old', etag: key === targets[3][0] ? '*' : 'v1' })
    ),
    /InvalidETag/
  );
  assert.equal(writes, 0);
});

test('all 15 changed subsets after the last GET preserve intervening writer bytes', async (t) => {
  t.mock.method(console, 'log', () => {});
  // Exhaust all 15 nonempty subsets changed by another writer after GET.
  // A conditional failure stops the remaining writes without an unguarded retry.
  for (let mask = 1; mask < 16; mask++) {
    const live = targets.map(() => ({ body: 'old', etag: 'v1' }));
    const snapshot = targets.map(([key]) => ({ key, sha256: sha256('old') }));
    const replacement = targets.map(() => ({ body: Buffer.from('reviewed'), headers: {} }));
    let reads = 0;
    let writes = 0;
    const read = async (_client, key) => {
      const index = targets.findIndex(([candidate]) => candidate === key);
      const response = { sha256: sha256(live[index].body), etag: live[index].etag };
      if (++reads === 4) {
        for (let i = 0; i < 4; i++) {
          if (mask & (1 << i)) live[i] = { body: 'external', etag: 'v2' };
        }
      }
      return response;
    };
    const client = {
      send: async (command) => {
        writes++;
        const index = targets.findIndex(([key]) => key === command.input.Key);
        assert.equal(command.input.Bucket, 'rbx-content');
        if (command.input.IfMatch !== live[index].etag) throw new Error('PreconditionFailed');
        live[index] = { body: command.input.Body.toString(), etag: 'v3' };
      }
    };
    await assert.rejects(guardedWrite(client, snapshot, replacement, read), /PreconditionFailed/);
    assert.equal(reads, 4);
    assert.ok(writes <= 4);
    for (let index = 0; index < 4; index++) {
      if (mask & (1 << index)) assert.equal(live[index].body, 'external');
    }
  }
});

test('restore accepts all 16 old/reviewed mixtures and rejects a third version before PUT', async (t) => {
  t.mock.method(console, 'log', () => {});
  const snapshot = targets.map(([key]) => ({
    key,
    sha256: sha256('old'),
    headers: { ContentType: 'text/markdown' }
  }));
  const replacements = targets.map(() => ({
    body: Buffer.from('old'),
    headers: { ContentType: 'text/markdown' }
  }));
  for (let mask = 0; mask < 16; mask++) {
    let writes = 0;
    const read = async (_client, key) => {
      const index = targets.findIndex(([candidate]) => key === candidate);
      return {
        sha256: mask & (1 << index) ? targets[index][1] : snapshot[index].sha256,
        etag: 'v1',
        headers: { ContentType: 'text/markdown' }
      };
    };
    await guardedWrite(
      {
        send: async () => {
          writes++;
        }
      },
      snapshot,
      replacements,
      read,
      true
    );
    assert.equal(writes, 4);
  }
  let writes = 0;
  await assert.rejects(
    guardedWrite(
      {
        send: async () => {
          writes++;
        }
      },
      snapshot,
      replacements,
      async () => ({ sha256: 'external' }),
      true
    ),
    /LiveContentChanged/
  );
  assert.equal(writes, 0);
});

test('header drift with unchanged bytes is refused; header comparison detects missing values', async () => {
  const snapshot = targets.map(([key]) => ({
    key,
    sha256: 'old',
    headers: { ContentType: 'text/markdown' }
  }));
  let writes = 0;
  await assert.rejects(
    guardedWrite(
      {
        send: async () => {
          writes++;
        }
      },
      snapshot,
      [],
      async () => ({ sha256: 'old', etag: 'same', headers: { ContentType: 'text/html' } })
    ),
    /LiveHeadersChanged/
  );
  assert.equal(writes, 0);
  assert.equal(headersMatch({ ContentType: 'text/markdown' }, {}), false);
  assert.equal(
    headersMatch({ ContentType: 'text/markdown' }, { ContentType: 'text/markdown' }),
    true
  );
});

test('timeout after server acceptance records attempt and stops without retry', async (t) => {
  const events = [];
  t.mock.method(console, 'log', (value) => events.push(JSON.parse(value)));
  const snapshot = targets.map(([key]) => ({ key, sha256: 'old' }));
  const replacements = targets.map(() => ({ body: Buffer.from('new'), headers: {} }));
  let writes = 0;
  const accepted = [];
  const client = {
    send: async (command) => {
      writes++;
      accepted.push(command.input.Key);
      throw new Error('Timeout');
    }
  };
  await assert.rejects(
    guardedWrite(client, snapshot, replacements, async () => ({ sha256: 'old', etag: 'v1' })),
    /Timeout/
  );
  assert.equal(writes, 1);
  assert.deepEqual(accepted, [targets[0][0]]);
  assert.deepEqual(
    events.map((event) => event.event),
    ['object_write_attempt']
  );
  assert.equal(events[0].key, targets[0][0]);
});

test('publish refuses invalid, future and stale snapshot dates before accessing credentials', () => {
  const f = fixture();
  try {
    for (const [date, reason] of [
      ['invalid', 'SnapshotDate'],
      [new Date(Date.now() + 86400000).toISOString(), 'SnapshotStale'],
      [new Date(Date.now() - 172800000).toISOString(), 'SnapshotStale']
    ]) {
      f.manifest.captured_at = date;
      f.save();
      const result = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL('./site-content-recovery.mjs', import.meta.url)),
          'publish',
          f.directory,
          '--apply-four-reviewed-objects'
        ],
        { encoding: 'utf8', timeout: 5000, env: { PATH: f.directory } }
      );
      assert.equal(result.status, 1);
      assert.equal(JSON.parse(result.stderr).reason, reason);
    }
  } finally {
    rmSync(f.directory, { recursive: true });
  }
});
