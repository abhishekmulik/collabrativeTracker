# AI Dev Kit (Claude Code, project-agnostic)

Install once: ./install.sh (puts agents and commands in ~/.claude).
Per project: copy CLAUDE.project.md to CLAUDE.md and fill in stack and commands.

Flow:
/kickoff <idea>  -> planner writes SPEC, ARCHITECTURE, PLAN. You approve.
/build-phase 1   -> implementer -> test-engineer -> code-reviewer loop (max 3 rounds)
/build-phase 2 ... repeat
/ship            -> quality-auditor + release-engineer, human approves prod deploy
/review          -> ad hoc independent review any time

Human gates: plan approval, new dependencies, API/schema changes, production deploy.
