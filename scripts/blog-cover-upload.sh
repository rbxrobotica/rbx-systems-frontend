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

# Catalogued covers use immutable, versioned object names. This matters because
# the public proxy sends a one-year immutable cache header: overwriting a key
# would leave browsers and social previews on stale pixels. Legacy, uncatalogued
# uploads retain the historical unversioned behavior.
CATALOG="$(dirname "$0")/../blog-covers-src/covers.json"
REVISION=""
if [[ -f "$CATALOG" ]]; then
  REVISION="$(python3 - "$CATALOG" "$SLUG" <<'PY'
import json
import sys

catalog_path, slug = sys.argv[1:]
for spec in json.load(open(catalog_path, encoding="utf-8")).get("posts", []):
    if spec.get("slug") == slug:
        print(spec.get("revision", ""))
        break
PY
)"
fi

if [[ -n "$REVISION" ]]; then
  EXPECTED_BASENAME="${SLUG}-v${REVISION}.${EXT}"
  if [[ "$(basename "$FILE")" != "$EXPECTED_BASENAME" ]]; then
    echo "Catalogued cover filename must be: $EXPECTED_BASENAME" >&2
    echo "Generate it with: python3 scripts/generate-cover.py --slug $SLUG" >&2
    exit 1
  fi
  DEST_STEM="${SLUG}-v${REVISION}"
else
  DEST_STEM="$SLUG"
fi

DEST="blog/covers/${DEST_STEM}.${EXT}"

echo "Uploading cover: $FILE → s3://$BUCKET/$DEST"
aws s3 cp "$FILE" "s3://$BUCKET/$DEST" \
  --endpoint-url "$ENDPOINT" \
  --content-type "$CONTENT_TYPE"

cat <<EOF
Cover object:  s3://$BUCKET/$DEST
Served at:     /api/blog/cover/${DEST_STEM}.${EXT}   (server-side proxy; bucket is private)
Frontmatter:   cover: "${ENDPOINT}/${BUCKET}/${DEST}"
               (the gateway normalizes this S3 URL to the /api/blog/cover/ proxy)
EOF
