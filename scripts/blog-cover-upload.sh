#!/usr/bin/env bash
# Upload a blog cover image to the Contabo Object Storage bucket.
#
# The bucket is PRIVATE: the cover is served to browsers through the site's
# server-side proxy at /api/blog/cover/<slug>.<ext> (see gateway.ts
# normalizeCover). Do NOT use the raw S3 URL publicly — it is not accessible.
#
# Usage: ./scripts/blog-cover-upload.sh <image-file> <slug>
# Example: ./scripts/blog-cover-upload.sh /tmp/cover.png 2026-04-01-lancamento-strategos
# Accepts .jpg, .jpeg, or .png — stored preserving the original extension.
set -euo pipefail

# shellcheck source=_s3-env.sh
. "$(dirname "$0")/_s3-env.sh"

FILE="${1:?Usage: $0 <image-file> <slug>}"
SLUG="${2:?Usage: $0 <image-file> <slug>}"

EXT="${FILE##*.}"
EXT="${EXT,,}"  # lowercase

case "$EXT" in
  jpg|jpeg) CONTENT_TYPE="image/jpeg" ;;
  png)      CONTENT_TYPE="image/png" ;;
  *)        echo "Unsupported format: .$EXT (use jpg or png)" >&2; exit 1 ;;
esac

DEST="blog/covers/${SLUG}.${EXT}"

echo "Uploading cover: $FILE → s3://$BUCKET/$DEST"
aws s3 cp "$FILE" "s3://$BUCKET/$DEST" \
  --endpoint-url "$ENDPOINT" \
  --content-type "$CONTENT_TYPE"

cat <<EOF
Cover object:  s3://$BUCKET/$DEST
Served at:     /api/blog/cover/${SLUG}.${EXT}   (server-side proxy; bucket is private)
Frontmatter:   cover: "${ENDPOINT}/${BUCKET}/${DEST}"
               (the gateway normalizes this S3 URL to the /api/blog/cover/ proxy)
               For .jpg covers you may instead omit 'cover' — it defaults to
               /api/blog/cover/${SLUG}.jpg automatically.
EOF
