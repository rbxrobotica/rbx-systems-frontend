#!/usr/bin/env bash
# Upload site assets to S3 under assets/ prefix.
#
# Usage (single file):
#   ./scripts/assets-upload.sh <file> <s3-path>
#   ./scripts/assets-upload.sh public/bitmap.svg ui/bitmap.svg
#   ./scripts/assets-upload.sh /tmp/rafael.jpg   team/rafael-scharf.jpg
#
# Usage (bulk — upload all files in public/ to assets/ui/):
#   ./scripts/assets-upload.sh --bulk-ui
#
# The <s3-path> is relative to assets/ in the bucket, e.g.:
#   ui/bitmap.svg        → s3://rbx-content/assets/ui/bitmap.svg
#   team/rafael.jpg      → s3://rbx-content/assets/team/rafael.jpg
#   about/rbx-about.jpeg → s3://rbx-content/assets/about/rbx-about.jpeg

set -euo pipefail

BUCKET="${CONTABO_S3_CONTENT_BUCKET:-rbx-content}"
ENDPOINT="${CONTABO_S3_ENDPOINT:-https://eu2.contabostorage.com}"

content_type() {
  local ext="${1##*.}"
  ext="${ext,,}"
  case "$ext" in
    svg)        echo "image/svg+xml" ;;
    jpg|jpeg)   echo "image/jpeg" ;;
    png)        echo "image/png" ;;
    webp)       echo "image/webp" ;;
    *)          echo "application/octet-stream" ;;
  esac
}

upload_file() {
  local file="$1"
  local s3_path="$2"
  local ct
  ct="$(content_type "$file")"
  local dest="assets/${s3_path}"

  echo "→ $file  →  s3://$BUCKET/$dest  ($ct)"
  aws s3 cp "$file" "s3://$BUCKET/$dest" \
    --endpoint-url "$ENDPOINT" \
    --content-type "$ct" \
    --acl public-read
}

if [[ "${1:-}" == "--bulk-ui" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PUBLIC_DIR="$SCRIPT_DIR/../public"

  echo "Uploading all UI assets from $PUBLIC_DIR to s3://$BUCKET/assets/ui/"
  for f in "$PUBLIC_DIR"/*.svg "$PUBLIC_DIR"/*.jpg "$PUBLIC_DIR"/*.jpeg "$PUBLIC_DIR"/*.png; do
    [[ -f "$f" ]] || continue
    upload_file "$f" "ui/$(basename "$f")"
  done
  echo "Done."
else
  FILE="${1:?Usage: $0 <file> <s3-path>}"
  S3_PATH="${2:?Usage: $0 <file> <s3-path>}"
  upload_file "$FILE" "$S3_PATH"
  echo "Live at: /api/assets/${S3_PATH}"
fi
