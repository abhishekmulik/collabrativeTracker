#!/usr/bin/env bash
# Links agents and commands from the ai-dev-kit submodule into .claude/ so Claude Code loads them.
# Re-run after bumping the submodule (new agents/commands appear, removed ones are cleaned up).
# COPY=1 .claude/sync-kit.sh   -> copy instead of symlink (e.g. on Windows without symlink support)
set -euo pipefail
cd "$(dirname "$0")/.."
KIT=.claude/kit
[ -f "$KIT/agents/planner.md" ] || { echo "Kit missing. Run: git submodule update --init"; exit 1; }
for kind in agents commands; do
  mkdir -p ".claude/$kind"
  for l in .claude/$kind/*.md; do
    if [ -L "$l" ] && [ ! -e "$l" ]; then rm "$l"; fi
  done
  for f in "$KIT/$kind"/*.md; do
    name=$(basename "$f"); target=".claude/$kind/$name"
    if [ -e "$target" ] && [ ! -L "$target" ] && [ "${COPY:-0}" != 1 ]; then
      echo "skip $target (project-specific file, not managed by the kit)"; continue
    fi
    if [ "${COPY:-0}" = 1 ]; then rm -f "$target"; cp "$f" "$target"; else ln -sfn "../kit/$kind/$name" "$target"; fi
  done
done
echo "Synced ai-dev-kit @ $(git -C "$KIT" rev-parse --short HEAD)"
