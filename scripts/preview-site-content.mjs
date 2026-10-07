// Read-only local preview of the real SSR build, with four in-memory S3 fixtures.
// No production credentials, content writes, forms, analytics or model calls.
import { createServer, request as httpRequest } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pages = new Map();
for (const locale of ['pt-BR', 'en']) {
  for (const page of ['home', 'solutions']) {
    const body = readFileSync(new URL(`site-content/${locale}/${page}/index.md`, root));
    pages.set(`/rbx-content/site/${locale}/${page}/index.md`, {
      body,
      sha256: createHash('sha256').update(body).digest('hex')
    });
  }
}

const servers = [];
let application;
let stopping = false;

async function listen(server) {
  servers.push(server);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address().port;
}

function stop() {
  if (stopping) return;
  stopping = true;
  for (const server of servers) server.close();
  if (application && application.exitCode === null) application.kill('SIGTERM');
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

async function main() {
  const storagePort = await listen(
    createServer((req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405).end();
        return;
      }
      const page = pages.get(new URL(req.url, 'http://localhost').pathname);
      if (!page) {
        res.writeHead(404, { 'Content-Type': 'application/xml' });
        res.end('<Error><Code>NoSuchKey</Code></Error>');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/markdown',
        'Content-Length': page.body.length,
        ETag: `"${page.sha256}"`
      });
      res.end(page.body);
    })
  );

  // Select an ephemeral loopback port without changing host/network configuration.
  const reservation = createServer();
  const applicationPort = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  application = spawn(process.execPath, [fileURLToPath(new URL('build/index.js', root))], {
    cwd: fileURLToPath(root),
    stdio: 'ignore',
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(applicationPort),
      CONTABO_S3_ENDPOINT: `http://127.0.0.1:${storagePort}`,
      CONTABO_S3_CONTENT_BUCKET: 'rbx-content',
      CONTABO_S3_ACCESS_KEY: 'local-preview-fixture',
      CONTABO_S3_SECRET_KEY: 'local-preview-fixture',
      AWS_EC2_METADATA_DISABLED: 'true'
    }
  });
  application.once('exit', () => {
    if (!stopping) {
      console.error('Local preview application exited.');
      process.exitCode = 1;
      stop();
    }
  });

  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (application.exitCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${applicationPort}/healthz`, {
        signal: AbortSignal.timeout(500)
      });
      await response.arrayBuffer();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Local readiness only; no provider request or retry exists in this preview.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Local preview application did not become ready.');

  const urls = {};
  for (const [locale, host] of [
    ['pt-BR', 'rbx.ia.br'],
    ['en', 'rbxsystems.ch']
  ]) {
    const port = await listen(
      createServer((req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405).end('Read-only preview');
          return;
        }
        const upstream = httpRequest(
          {
            hostname: '127.0.0.1',
            port: applicationPort,
            path: req.url,
            method: req.method,
            headers: { host },
            timeout: 5000
          },
          (response) => {
            res.writeHead(response.statusCode, {
              ...response.headers,
              'Cache-Control': 'no-store',
              // Block hydration and all interaction, including direct Comms calls.
              'Content-Security-Policy':
                "default-src 'self'; script-src 'none'; connect-src 'none'; form-action 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; base-uri 'none'"
            });
            response.pipe(res);
          }
        );
        upstream.once('timeout', () => upstream.destroy());
        upstream.once('error', () => {
          if (!res.headersSent) res.writeHead(502);
          res.end('Preview unavailable');
        });
        upstream.end();
      })
    );
    urls[locale] = `http://127.0.0.1:${port}`;
  }
  console.log(
    JSON.stringify({
      status: 'ready',
      urls,
      mode: 'read-only-local-SSR',
      production_credentials: false,
      remote_content_writes: false,
      model_calls: 0,
      sources: [...pages].map(([key, { sha256 }]) => ({ key, sha256 }))
    })
  );
}

main().catch(() => {
  console.error('Unable to start local content preview.');
  process.exitCode = 1;
  stop();
});
