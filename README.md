# Collaborative Habit Tracker

Shared, competitive habit tracking for small private groups. Product truth: `PRODUCT.md`. Plan: `docs/PLAN.md` (summary in `docs/PLAN_SUMMARY.md`). Conventions and commands: `CLAUDE.md`.

## AI workflow (ai-dev-kit)

Claude agents and commands live in the [ai-dev-kit](https://github.com/abhishekmulik/ai-dev-kit) repo and are pulled in as a submodule at `.claude/kit`.

First clone:
```
git clone --recurse-submodules https://github.com/abhishekmulik/collabrativeTracker.git
.claude/sync-kit.sh
```

Update to the latest kit:
```
git submodule update --remote .claude/kit
.claude/sync-kit.sh
git add -A && git commit -m "chore: bump ai-dev-kit"
```

Project-specific agents or commands can be added as normal files in `.claude/agents` or `.claude/commands`; the sync script never overwrites them.
