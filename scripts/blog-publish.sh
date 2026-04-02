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

assert_utf8() {
  local file="$1"

  if command -v iconv >/dev/null 2>&1; then
    if ! iconv -f UTF-8 -t UTF-8 "$file" >/dev/null; then
      echo "Invalid UTF-8 encoding: $file" >&2
      exit 1
    fi
  fi
}

is_legacy_pt_br_base() {
  local file="$1"
  local slug base_dir

  [[ "$file" == blog-posts/*.mdx ]] || return 1
  [[ "$file" != *.pt-BR.mdx ]] || return 1
  [[ "$file" != *.en.mdx ]] || return 1

  base_dir=$(dirname "$file")
  slug=$(basename "$file" .mdx)

  [[ -f "$base_dir/$slug.en.mdx" ]] || return 1
  [[ ! -f "$base_dir/$slug.pt-BR.mdx" ]]
}

assert_pt_br_orthography() {
  local file="$1"
  local regex

  regex='(^|[^[:alpha:]])(nao|producao|producoes|configuracao|configuracoes|operacao|operacoes|execucao|execucoes|decisao|decisoes|aplicacao|aplicacoes|informacao|informacoes|integracao|integracoes|migracao|migracoes|manutencao|orquestracao|reconciliacao|investigacao|codificacao|permissao|permissoes|transicao|transicoes|observacao|observacoes|depuracao|dominio|dominios|parametro|parametros|proposito|estrategia|estrategias|grafico|graficos|sessao|sessoes|angulo|pratica|autonoma|autonomo)([^[:alpha:]]|$)'

  if LC_ALL=C grep -Eni "$regex" "$file" >/dev/null; then
    echo "Refusing to publish $file: suspected ASCII transliteration in pt-BR content." >&2
    echo "Use Portuguese orthography with UTF-8 accents and cedilha." >&2
    LC_ALL=C grep -Eni "$regex" "$file" >&2
    exit 1
  fi
}

validate_file_before_publish() {
  local file="$1"

  assert_utf8 "$file"

  if [[ "$file" == *.pt-BR.mdx ]] || is_legacy_pt_br_base "$file"; then
    assert_pt_br_orthography "$file"
  fi
}

publish_file() {
  local file="$1"
  local slug public_slug

  if [[ ! -f "$file" ]]; then
    echo "File not found: $file" >&2
    exit 1
  fi

  validate_file_before_publish "$file"

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
