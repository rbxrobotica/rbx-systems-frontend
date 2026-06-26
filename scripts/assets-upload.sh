#!/usr/bin/env bash
# Upload site assets to the Contabo Object Storage bucket under the assets/ prefix.
# The bucket is PRIVATE; assets are served through the server-side proxy
# /api/assets/<path> (see gateway.ts getAsset + routes/api/assets).
#
# Usage (single file):
#   ./scripts/assets-upload.sh <file> <s3-path>
#   ./scripts/assets-upload.sh public/bitmap.svg ui/bitmap.svg
#   ./scripts/assets-upload.sh /tmp/rafael.jpg   team/rafael-scharf.jpg
# Usage (bulk — upload all files in public/ to assets/ui/):
#   ./scripts/assets-upload.sh --bulk-ui
#
# The <s3-path> is relative to assets/ in the bucket, e.g.:
#   ui/bitmap.svg        → s3://rbx-content/assets/ui/bitmap.svg  → /api/assets/ui/bitmap.svg
#   team/rafael.jpg      → s3://rbx-content/assets/team/rafael.jpg
set -euo pipefail

# shellcheck source=_s3-env.sh
. "$(dirname "$0")/_s3-env.sh"

content_type() {
  local ext="${1##*.}"
  case "$ext" in
    svg)      echo "image/svg+xml" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    png)      echo "image/png" ;;
    webp)     echo "image/webp" ;;
    *)        echo "application/octet-stream" ;;
  esac
}

upload_file() {
  local file="$1"
  local s3_path="$2"
  local ct dest
  ct="$(content_type "$file")"
  dest="assets/${s3_path}"
  echo "→ $file  →  s3://$BUCKET/$dest  ($ct)"
  aws s3 cp "$file" "s3://$BUCKET/$dest" \
    --endpoint-url "$ENDPOINT" \
    --content-type "$ct"
}

if [[ "${1:-}" == "--bulk-ui" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PUBLIC_DIR="$SCRIPT_DIR/../public"
  echo "Uploading all UI assets from $PUBLIC_DIR to s3://$BUCKET/assets/ui/"
  for f in "$PUBLIC_DIR"/*.svg "$PUBLIC_DIR"/*.jpg "$PUBLIC_DIR"/*.jpeg "$PUBLIC_DIR"/*.png; do
    [[ -f "$f" ]] || continue
    upload_file "$f" "ui/$(basename "$f")"
  done
  echo "Live via /api/assets/ui/<filename>"
  exit 0
fi

FILE="${1:?Usage: $0 <file> <s3-path>}"
S3_PATH="${2:?Usage: $0 <file> <s3-path>}"
upload_file "$FILE" "$S3_PATH"
echo "Live at: /api/assets/${S3_PATH}"
