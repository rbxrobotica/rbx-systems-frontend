#!/usr/bin/env bash
# Usage:
#   ./scripts/blog-publish.sh blog-posts/2026-03-25-my-post.mdx
#   ./scripts/blog-publish.sh --all-locales 2026-03-25-my-post
#   ./scripts/blog-publish.sh --all-locales blog-posts/2026-03-25-my-post.pt-BR.mdx
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/blog-publish.sh <path-to-post.mdx>
  ./scripts/blog-publish.sh --all-locales <slug-or-path>

Examples:
  ./scripts/blog-publish.sh blog-posts/2026-03-25-my-post.mdx
  ./scripts/blog-publish.sh --all-locales 2026-03-25-my-post
  ./scripts/blog-publish.sh --all-locales blog-posts/2026-03-25-my-post.en.mdx
EOF
}

strip_locale_suffix() {
  local slug="$1"
  case "$slug" in
    *.pt-BR) echo "${slug%.pt-BR}" ;;
    *.en) echo "${slug%.en}" ;;
    *) echo "$slug" ;;
  esac
}

publish_file() {
  local file="$1"
  local slug public_slug

  if [[ ! -f "$file" ]]; then
    echo "File not found: $file" >&2
    exit 1
  fi

  slug=$(basename "$file" .mdx)
  public_slug=$(strip_locale_suffix "$slug")

  echo "Publishing: $slug → s3://$BUCKET/blog/posts/$slug.mdx"

  aws s3 cp "$file" "s3://$BUCKET/blog/posts/$slug.mdx" \
    --endpoint-url "$ENDPOINT" \
    --content-type "text/plain; charset=utf-8" \
    --acl public-read

  echo "Done. Variant live at /blog/$public_slug within 5 minutes (ISR revalidate)."
}

resolve_base_slug() {
  local input="$1"
  local name

  name=$(basename "$input")
  name="${name%.mdx}"
  strip_locale_suffix "$name"
}

PUBLISH_ALL_LOCALES=false

if [[ "${1:-}" == "--all-locales" ]]; then
  PUBLISH_ALL_LOCALES=true
  shift
fi

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

INPUT="$1"
BUCKET="${CONTABO_S3_CONTENT_BUCKET:-rbx-content}"
ENDPOINT="${CONTABO_S3_ENDPOINT:-https://eu2.contabostorage.com}"

if [[ "$PUBLISH_ALL_LOCALES" == "true" ]]; then
  BASE_SLUG=$(resolve_base_slug "$INPUT")
  CANDIDATES=(
    "blog-posts/${BASE_SLUG}.mdx"
    "blog-posts/${BASE_SLUG}.pt-BR.mdx"
    "blog-posts/${BASE_SLUG}.en.mdx"
  )

  FOUND=0
  for file in "${CANDIDATES[@]}"; do
    if [[ -f "$file" ]]; then
      publish_file "$file"
      FOUND=1
    fi
  done

  if [[ "$FOUND" -eq 0 ]]; then
    echo "No blog post files found for slug: $BASE_SLUG" >&2
    exit 1
  fi

  exit 0
fi

publish_file "$INPUT"
