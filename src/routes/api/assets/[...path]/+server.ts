import type { RequestHandler } from './$types';
import { getAsset } from '$lib/server/content/gateway';

// Server-side proxy for UI assets (team photos, SVGs, hero images). Keeps the
// Object Storage bucket private. (ADR-0002)
export const GET: RequestHandler = async ({ params }) => {
  const asset = await getAsset('assets/', params.path);
  if (!asset) return new Response('Not Found', { status: 404 });
  return new Response(new Uint8Array(asset.bytes), {
    headers: {
      'content-type': asset.contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
};
