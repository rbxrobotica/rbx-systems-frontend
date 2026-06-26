#!/usr/bin/env bash
# shellcheck shell=bash
# Shared Contabo S3 environment for the content scripts. Source'd, not executed.
#
# - Loads CONTABO_S3_* credentials from the repo .env when present (local dev),
#   otherwise relies on AWS_* already in the environment (CI / cluster secret).
# - Forces path-style addressing, matching the site gateway's forcePathStyle
#   (src/lib/server/content/store.ts). The bucket is PRIVATE: these scripts only
#   WRITE objects; the site reads them server-side via the Content Gateway.
#
# After sourcing: $BUCKET, $ENDPOINT, AWS_CONFIG_FILE (+ AWS_ACCESS_KEY_ID /
# AWS_SECRET_ACCESS_KEY when loaded from .env) are exported.

_repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$_repo_root/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "$_repo_root/.env"
  set +a
fi

: "${CONTABO_S3_CONTENT_BUCKET:=rbx-content}"
: "${CONTABO_S3_ENDPOINT:=https://eu2.contabostorage.com}"
export BUCKET="$CONTABO_S3_CONTENT_BUCKET"
export ENDPOINT="$CONTABO_S3_ENDPOINT"

# Prefer Contabo keys, fall back to standard AWS_* if already set.
[[ -n "${CONTABO_S3_ACCESS_KEY:-}" ]] && export AWS_ACCESS_KEY_ID="$CONTABO_S3_ACCESS_KEY"
[[ -n "${CONTABO_S3_SECRET_KEY:-}" ]] && export AWS_SECRET_ACCESS_KEY="$CONTABO_S3_SECRET_KEY"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Missing S3 credentials: set CONTABO_S3_ACCESS_KEY/CONTABO_S3_SECRET_KEY" >&2
  echo "(in the repo .env for local dev, or via the cluster secret / env in CI)." >&2
  return 1 2>/dev/null || exit 1
fi

# Force path-style addressing for the aws-cli (Contabo; matches forcePathStyle).
_aws_cfg="$(mktemp)"
printf '[default]\ns3.addressing_style = path\n' > "$_aws_cfg"
export AWS_CONFIG_FILE="$_aws_cfg"
trap 'rm -f "$_aws_cfg"' EXIT
