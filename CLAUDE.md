# Project: Collaborative Habit Tracker

## Stack
- Framework / language: React + TypeScript + Vite (installable PWA via vite-plugin-pwa)
- Package manager: npm
- State management: TanStack Query + local UI state
- Styling / UI library: Tailwind CSS; Framer Motion for animation; Recharts for charts
- Test frameworks (unit / component / e2e): Vitest + React Testing Library + Playwright
- Backend: Supabase (Postgres with row-level security, Google auth, email magic link, realtime)
- Email: Transactional email service (Resend) for invites
- Deploy target: Vercel

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- Deploy preview: `vercel`
- Deploy production (human only): `vercel --prod`

## Conventions
- Philosophy: UI crafted via Impeccable (craft floor, delight, motion, a11y); code architected via Ponytail (least new code, strict YAGNI, Decision Ladder, stdlib/native over bloat; see AGENTS.md)
- Folder structure: Feature-first under `src/features/<feature>` with `src/lib`, `src/components`, `src/app`
- Naming: PascalCase components, camelCase functions/vars, kebab-case route files
- Error handling and logging: User-facing errors surfaced in UI, no silent catches
- Branching / base branch: main
- Commit style: Conventional Commits

## Domain rules
- A Space's data is readable only by its members; enforced with Supabase row-level security, not app code alone.
- Per-habit visibility (shared / percentage only / private) must be enforced server-side; Admins never see private habit details.
- Invites are matched by link token, not only by email address.
- One active challenge per Space at a time in v1.
- Scoring in v1: plain completion percentage.

## Definition of done (every phase)
- Typecheck, lint, tests, build all green
- Acceptance criteria in docs/PLAN.md each covered by a test
- code-reviewer verdict APPROVE
- No TODOs left without an entry in docs/BACKLOG.md

## Agent workflow
Agents and commands come from the ai-dev-kit, the single source of truth for how Claude behaves. It is a git submodule at `.claude/kit` and is linked into `.claude/agents` and `.claude/commands` by `.claude/sync-kit.sh`. Do not edit those linked files here; change them in the ai-dev-kit repo, then bump the submodule (see README).

Flow: /kickoff -> /review-plan (plan-reviewer loop) -> human sets `Status: approved` in docs/PLAN.md -> /build-phase N (implement -> test -> review loop) -> /ship (audit + release).
Humans approve: the plan (after plan-reviewer APPROVE), any new dependency, any schema/API contract change, production deploy.
Never: disable tests to pass, commit secrets, push to main directly.
