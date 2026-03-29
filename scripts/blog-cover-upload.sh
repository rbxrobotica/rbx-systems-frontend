#!/usr/bin/env bash
# Usage: ./scripts/blog-cover-upload.sh <image-file> <slug>
# Example: ./scripts/blog-cover-upload.sh /tmp/cover.jpg 2026-04-01-lancamento-strategos
set -euo pipefail

FILE="${1:?Usage: $0 <image-file> <slug>}"
SLUG="${2:?Usage: $0 <image-file> <slug>}"
BUCKET="${CONTABO_S3_CONTENT_BUCKET:-rbx-content}"
ENDPOINT="${CONTABO_S3_ENDPOINT:-https://eu2.contabostorage.com}"
DEST="blog/covers/${SLUG}.jpg"

echo "Uploading cover: $FILE → s3://$BUCKET/$DEST"

aws s3 cp "$FILE" "s3://$BUCKET/$DEST" \
  --endpoint-url "$ENDPOINT" \
  --content-type "image/jpeg"

echo "Cover live at: ${ENDPOINT}/${BUCKET}/${DEST}"
