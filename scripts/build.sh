#!/usr/bin/env bash
set -euo pipefail

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git rev-parse HEAD >/dev/null 2>&1; then
  echo "[build] Git history detected; enabling Git info"
  hugo --gc --minify --enableGitInfo "$@"
else
  echo "[build] No commits yet; running without --enableGitInfo"
  hugo --gc --minify "$@"
fi
