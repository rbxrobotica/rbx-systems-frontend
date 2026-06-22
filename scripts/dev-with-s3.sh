#!/usr/bin/env bash
set -euo pipefail

export CONTABO_S3_ENDPOINT="https://eu2.contabostorage.com"
export CONTABO_S3_ACCESS_KEY="$(pass rbx/s3/access-key)"
export CONTABO_S3_SECRET_KEY="$(pass rbx/s3/secret-key)"
export CONTABO_S3_CONTENT_BUCKET="rbx-content"

cd "$(dirname "$0")/.."
pnpm dev
