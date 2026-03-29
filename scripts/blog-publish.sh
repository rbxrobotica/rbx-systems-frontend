#!/usr/bin/env bash
# Usage: ./scripts/blog-publish.sh blog-posts/2026-03-25-my-post.mdx
set -euo pipefail

FILE="${1:?Usage: $0 <path-to-post.mdx>}"
SLUG=$(basename "$FILE" .mdx)
BUCKET="${CONTABO_S3_CONTENT_BUCKET:-rbx-content}"
ENDPOINT="${CONTABO_S3_ENDPOINT:-https://eu2.contabostorage.com}"

echo "Publishing: $SLUG → s3://$BUCKET/blog/posts/$SLUG.mdx"

aws s3 cp "$FILE" "s3://$BUCKET/blog/posts/$SLUG.mdx" \
  --endpoint-url "$ENDPOINT" \
  --content-type "text/plain; charset=utf-8" \
  --acl public-read

echo "Done. Will be live on rbx.ia.br/blog/$SLUG within 5 minutes (ISR revalidate)."
