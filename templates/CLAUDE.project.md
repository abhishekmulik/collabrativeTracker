# Project: <name>

## Stack
- Framework / language:
- Package manager / monorepo tool:
- State management:
- Styling / UI library:
- Test frameworks (unit / component / e2e):

## Commands
- Install:
- Dev:
- Typecheck:
- Lint:
- Test:
- Build:
- Deploy preview:
- Deploy production (human only):

## Conventions
- Folder structure:
- Naming:
- Error handling and logging:
- Branching / base branch: main
- Commit style: Conventional Commits

## Definition of done (every phase)
- Typecheck, lint, tests, build all green
- Acceptance criteria in docs/PLAN.md each covered by a test
- code-reviewer verdict APPROVE
- No TODOs left without an entry in docs/BACKLOG.md

## Agent workflow
Plan (planner) -> per phase: implement -> test -> review loop -> /ship (audit + release).
Humans approve: the plan, any new dependency, any schema/API contract change, production deploy.
Never: disable tests to pass, commit secrets, push to main directly.
