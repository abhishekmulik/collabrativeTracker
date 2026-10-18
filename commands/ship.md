---
description: Pre-release gate - audit, release prep, and deploy checklist. Stops before production.
---
1. Run `quality-auditor` on the whole project and the current diff.
2. If any High severity issue exists, stop and list them. Otherwise continue.
3. Run `release-engineer` to verify CI, build, env docs, changelog and rollback plan.
4. Present a go/no-go summary and the exact production deploy command from CLAUDE.md for the human to run or approve. Never run the production deploy yourself.
