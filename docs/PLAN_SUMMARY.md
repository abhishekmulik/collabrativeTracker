# Plan Summary — Collaborative Habit Tracker MVP

Full plan: `docs/PLAN.md`. Product truth: `PRODUCT.md`. Status: **awaiting human approval**.

## Phases

1. **Foundation — auth, Spaces, memberships, invites.** Google + magic link sign-in, create Space, roles, invite links (expiry/max uses/role) and email invites, join flows including request-to-join, pending invites panel, Space switcher. The riskiest phase; RLS established here.
2. **Habits and check-ins + Today screen.** Yes/no and counted habits, daily and X-times-per-week, three visibility levels, tick animation, check-in upsert/undo, streaks.
3. **Me dashboard.** Rings, current streak, 12-week calendar heatmap, purposeful empty state, responsive from 360 px.
4. **Challenges and Space leaderboard.** Presets 7/21/30/45/60 + custom, one active challenge per Space, leaderboard by completion percentage, line chart race, activity feed, leaderboard opt-out, final results screen, realtime updates.
5. **Animations and delight.** Confetti (standard and full-day burst), streak milestone badges at 7/21/30 (once each), animated leaderboard re-ordering with count-up numbers, reduced-motion support.
6. **Admin tab and privacy settings.** Member management (promote/demote/remove/transfer ownership), invites, challenge setup, Space settings, privacy controls with plain-language explanations.

## Key decisions

- **Stack:** React + TS + Vite PWA, Tailwind, Framer Motion, Recharts, TanStack Query, React Router, React Hook Form + Zod, Supabase (Postgres + RLS, Auth, Realtime), Resend-style transactional email.
- **Auth:** Supabase Auth with Google OAuth and email magic link; `auth.uid()` is the sole identity.
- **Invites:** the **token is the credential, not the email** — this resolves the "invited email differs from sign-in account" edge case. Must be signed up before joining; the token is preserved through the auth round-trip for auto-join. Usage counted atomically against `max_uses`; expiry and revocation enforced server-side.
- **RLS is the security boundary.** Admins see membership, never private habit details. Percentage-only habits expose aggregates through a dedicated view/RPC, never rows.
- **Scoring:** completion percentage derived at query time (no stored score). Working assumption pending confirmation.
- **One active challenge per Space** enforced by a partial unique index.
- **Dates:** check-ins stored as calendar dates; the Space's timezone (default: creator's) defines a "day."
- **Realtime is an enhancement**, not a correctness dependency; every screen refetches on mount/focus.
- **Email invites are effectively forwardable** (token-based). Recommended; flagged for confirmation.
- **Data model:** `users`, `spaces`, `memberships`, `invites`, `habits`, `checkins`, `challenges`, `badges`, `activity_feed`. No `goals` table in v1.

## Open questions (human decisions)

1. **Scoring for v1:** completion percentage (plan's assumption) vs points with streak bonuses.
2. **Package manager:** npm / pnpm / yarn — blocks scaffold.
3. **Test stack:** Vitest + React Testing Library + Playwright assumed.
4. **Deploy target:** Vercel / Netlify / Cloudflare Pages / other.
5. **Email provider:** Resend assumed; needs an account and API key.
6. **Email invites:** locked to invited address or forwardable? Recommended: forwardable.
7. **Space timezone:** per-Space setting vs each user's local date? Recommended: per-Space, defaulting to creator's.
8. **Dark theme in v1?** Not specified; omitted.

## Out of scope for v1

v1.5: head-to-head, goals/milestones, insights, trophy room, kudos/nudges, streak freezes, leagues, push notifications, points. v2: timed/numeric habits, proof photos, weekly recap cards, Google contacts picker, Strava/Google Fit, native wrapper.
