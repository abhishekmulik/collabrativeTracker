---
description: Independent review of the current branch (use on any code, AI-written or not).
---
Run the `code-reviewer` subagent on the current branch diff, then run `quality-auditor` in parallel if the diff touches auth, user input, routing, or build config. Merge both reports into one prioritized list.
