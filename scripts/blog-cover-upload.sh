#!/usr/bin/env bash
# Usage: ./scripts/blog-cover-upload.sh <image-file> <slug>
# Example: ./scripts/blog-cover-upload.sh /tmp/cover.png 2026-04-01-lancamento-strategos
# Accepts .jpg, .jpeg, or .png — stored in S3 preserving the original extension.
set -euo pipefail

FILE="${1:?Usage: $0 <image-file> <slug>}"
SLUG="${2:?Usage: $0 <image-file> <slug>}"
BUCKET="${CONTABO_S3_CONTENT_BUCKET:-rbx-content}"
ENDPOINT="${CONTABO_S3_ENDPOINT:-https://eu2.contabostorage.com}"

EXT="${FILE##*.}"
EXT="${EXT,,}"  # lowercase

case "$EXT" in
  jpg|jpeg) CONTENT_TYPE="image/jpeg" ;;
  png)      CONTENT_TYPE="image/png" ;;
  *)        echo "Unsupported format: .$EXT (use jpg or png)"; exit 1 ;;
esac

DEST="blog/covers/${SLUG}.${EXT}"

echo "Uploading cover: $FILE → s3://$BUCKET/$DEST"

aws s3 cp "$FILE" "s3://$BUCKET/$DEST" \
  --endpoint-url "$ENDPOINT" \
  --content-type "$CONTENT_TYPE"

echo "Cover live at: ${ENDPOINT}/${BUCKET}/${DEST}"
echo "Frontmatter:   cover: \"${ENDPOINT}/${BUCKET}/${DEST}\""
