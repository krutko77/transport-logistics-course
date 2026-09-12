#!/usr/bin/env bash
# Делает снимок текущего состояния проекта в git.
# Использование: bash scripts/snapshot.sh "сообщение коммита"
set -euo pipefail

cd "$(dirname "$0")/.."

MESSAGE="${1:-снимок проекта}"

git add -A

if git diff --cached --quiet; then
  echo "Нет изменений для снимка."
  exit 0
fi

git commit -m "$MESSAGE"
echo "Снимок сохранён: $MESSAGE"
