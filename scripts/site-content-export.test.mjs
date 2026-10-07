import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = new URL('./upload-site-content.cjs', import.meta.url);

function run(args) {
  return spawnSync(process.execPath, [script.pathname, ...args], {
    encoding: 'utf8',
    timeout: 10000,
    // An unreachable loopback endpoint catches accidental publish attempts.
    env: {
      PATH: process.env.PATH,
      CONTABO_S3_ENDPOINT: 'http://127.0.0.1:1',
      CONTABO_S3_ACCESS_KEY: 'offline-fixture',
      CONTABO_S3_SECRET_KEY: 'offline-fixture'
    }
  });
}

test('offline export contains exactly the selected locale pair and matching hashes', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'rbx-site-export-test-'));
  try {
    const directory = path.join(temporary, 'export');
    const result = run(['--only=home', `--export-dir=${directory}`]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /no S3 requests/);
    const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    assert.deepEqual(
      manifest.map(({ key }) => key),
      ['site/pt-BR/home/index.md', 'site/en/home/index.md']
    );
    for (const { key, sha256 } of manifest) {
      const exported = readFileSync(path.join(directory, key));
      const source = readFileSync(new URL(`../site-content/${key.slice(5)}`, import.meta.url));
      assert.deepEqual(exported, source);
      assert.equal(createHash('sha256').update(exported).digest('hex'), sha256);
    }
    const repeat = run(['--only=home', `--export-dir=${directory}`]);
    assert.notEqual(repeat.status, 0);
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
      manifest
    );
  } finally {
    rmSync(temporary, { recursive: true }); // Only this test's mkdtemp-owned directory.
  }
});

test('export refuses missing or invalid page scope before creating output', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'rbx-site-export-test-'));
  try {
    for (const args of [[], ['--only='], ['--only=unreviewed-page']]) {
      const directory = path.join(temporary, 'refused');
      const result = run([...args, `--export-dir=${directory}`]);
      assert.notEqual(result.status, 0);
      assert.equal(existsSync(directory), false);
    }
  } finally {
    rmSync(temporary, { recursive: true });
  }
});
