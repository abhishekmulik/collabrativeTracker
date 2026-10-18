#!/usr/bin/env bash
# Installs the kit at user level so it works in every project.
set -e
mkdir -p ~/.claude/agents ~/.claude/commands ~/.claude/templates
cp agents/*.md ~/.claude/agents/
cp commands/*.md ~/.claude/commands/
cp templates/* ~/.claude/templates/
echo "Installed. In any repo: copy ~/.claude/templates/CLAUDE.project.md to ./CLAUDE.md, fill it in, then run /kickoff"
echo "Optional: merge ~/.claude/templates/settings.hooks.json into ~/.claude/settings.json for auto-format."
