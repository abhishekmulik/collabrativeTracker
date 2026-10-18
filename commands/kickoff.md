---
description: Start a new project. Runs the planner and stops for human approval of the plan.
argument-hint: <one-paragraph idea or paste your detailed prompt>
---
Project idea / brief:
$ARGUMENTS

1. Ensure CLAUDE.md exists in the repo root; if not, create it from ~/.claude/templates/CLAUDE.project.md and fill in what you can infer, marking unknowns as TODO.
2. Invoke the `planner` subagent with the brief above.
3. Summarize the plan: phases, key decisions, open questions.
4. STOP. Do not implement anything until the human approves or edits docs/PLAN.md.
