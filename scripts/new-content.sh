#!/usr/bin/env bash
# new-content.sh — scaffolding for RBX public content (blog, service, product, page)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATES="$ROOT/docs/seo/templates"

usage() {
  echo "Usage: $0 <blog|service|product|page> <slug> [locale]"
  echo "Example: $0 blog 2026-07-03-agentes-producao pt-BR"
  exit 1
}

[ $# -lt 2 ] && usage

TYPE=$1
SLUG=$2
LOCALE=${3:-pt-BR}

DATE=$(date +%Y-%m-%d)

new_blog() {
  local dir="$ROOT/blog-posts"
  mkdir -p "$dir"
  local file="$dir/$DATE-$SLUG.$LOCALE.md"
  cp "$TEMPLATES/template-artigo.md" "$file"
  sed -i "s/2026-07-03/$DATE/g" "$file"
  sed -i "s/slug.jpg/$SLUG.jpg/g" "$file"
  echo "Created: $file"
}

new_page() {
  local template=$1
  local file="$ROOT/docs/seo/drafts/$SLUG.$LOCALE.md"
  mkdir -p "$(dirname "$file")"
  cp "$TEMPLATES/$template" "$file"
  echo "Created: $file"
}

case $TYPE in
  blog)
    new_blog
    ;;
  service)
    new_page template-pagina-servico.md
    ;;
  product)
    new_page template-pagina-produto.md
    ;;
  page)
    new_page template-pagina-institucional.md
    ;;
  *)
    usage
    ;;
esac
