import type { RequestHandler } from './$types';

// Vite replaces this constant with validated literals during the build. It is
// deliberately independent of the adapter-node runtime environment.
declare const __RBX_BUILD_RELEASE__: {
  revision: string | null;
  builtAt: string | null;
};

const release = Object.freeze(
  typeof __RBX_BUILD_RELEASE__ === 'undefined'
    ? { revision: null, builtAt: null }
    : __RBX_BUILD_RELEASE__
);

// Process liveness and build identity only: zero dependency/network/DB queries.
// Keep /healthz as the existing cheap plain-text probe.
export const GET: RequestHandler = () =>
  Response.json(
    {
      schemaVersion: 'rbx.health.v1',
      service: 'rbx-systems-frontend',
      health: { status: 'up' },
      release
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
