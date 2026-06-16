#!/usr/bin/env bash
# Push wiki-export/ to GitHub Wiki for dev-docs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT="$ROOT/wiki-export"
REPO="${DEV_DOCS_REPO:-jahrulnr/dev-docs}"
WIKI_URL="${WIKI_PUSH_URL:-}"

if [[ ! -d "$EXPORT" ]] || [[ -z "$(ls -A "$EXPORT"/*.md 2>/dev/null)" ]]; then
  echo "ERROR: wiki-export is empty. Run: node scripts/build-index.mjs && node scripts/export-wiki.mjs" >&2
  exit 1
fi

if [[ -z "$WIKI_PUSH_URL" ]]; then
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    WIKI_PUSH_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.wiki.git"
  else
    echo "ERROR: set GITHUB_TOKEN or WIKI_PUSH_URL" >&2
    exit 1
  fi
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

git -C "$WORKDIR" init -q
git -C "$WORKDIR" remote add origin "$WIKI_PUSH_URL"

if git -C "$WORKDIR" ls-remote --heads origin master 2>/dev/null | grep -q master; then
  git -C "$WORKDIR" pull origin master --depth=1
elif git -C "$WORKDIR" ls-remote --heads origin main 2>/dev/null | grep -q main; then
  git -C "$WORKDIR" checkout -b main 2>/dev/null || true
  git -C "$WORKDIR" pull origin main --depth=1
fi

rm -f "$WORKDIR"/*.md
cp -a "$EXPORT"/*.md "$WORKDIR"/

git -C "$WORKDIR" add -A
if git -C "$WORKDIR" diff --staged --quiet; then
  echo "Wiki unchanged — nothing to push."
  exit 0
fi

git -C "$WORKDIR" -c user.name="dev-docs wiki bot" -c user.email="dev-docs-bot@users.noreply.github.com" \
  commit -m "Sync wiki from ${REPO}@${GITHUB_SHA:-local}"

BRANCH="$(git -C "$WORKDIR" branch --show-current 2>/dev/null || echo master)"
if [[ -z "$BRANCH" || "$BRANCH" == "master" ]]; then
  git -C "$WORKDIR" push origin HEAD:master
else
  git -C "$WORKDIR" push origin HEAD:"$BRANCH"
fi

echo "Pushed $(find "$EXPORT" -maxdepth 1 -name '*.md' | wc -l) pages to ${REPO}.wiki"
