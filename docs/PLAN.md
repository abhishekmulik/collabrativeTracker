# Collaborative Habit Tracker — MVP Plan

> Status: **awaiting human approval**. No implementation begins until this plan is approved or edited.
> Product truth lives in `PRODUCT.md`. Conventions and commands live in `CLAUDE.md`.

## 1. Overview

A shared, competitive habit tracker built around **Spaces**: small private groups (friends, family, gym buddies, coworkers) who track habits and run timed **challenges** together. The differentiator is the **live race among people you already know** — progress is visible inside a private Space in real time, rather than being a solo streak or a public social feed.

v1 is a web-first **installable PWA**. Mobile web counts as web; a native wrapper is deferred to v2.

### v1 goals

1. A person can sign in, create a Space, and invite others by link or email.
2. Members can define habits and check in daily from a Today checklist.
3. An Admin can run one timed challenge per Space, with a leaderboard by completion percentage.
4. Members can see their own progress (rings, streak, heatmap) and the Space's race (leaderboard, line chart, activity feed).
5. The experience feels like a race: live updates, confetti, milestone badges, animated re-ordering.

### Success for v1

A group can complete the full arc — create Space → invite → check in → run a 21-day challenge → see final results — without manual intervention, with Space data visible only to members.

---

## 2. Architecture

### 2.1 Stack (confirmed in PRODUCT.md)

| Concern | Choice |
|---|---|
| App | React + TypeScript + Vite, `vite-plugin-pwa` |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Backend | Supabase — Postgres, RLS, Auth (Google + email magic link), Realtime |
| Email | Transactional provider (Resend assumed) for invites |
| Data fetching | TanStack Query wrapping Supabase; Supabase Realtime for live feeds |
| Routing | React Router |
| Forms/validation | React Hook Form + Zod |

Package manager (npm) and deploy target (Vercel) are confirmed. Test stack remains an open decision (§8).

### 2.2 App structure

```
src/
  app/            # router, providers, layout shells
  components/     # shared UI primitives (Button, Dialog, Avatar, Ring, Heatmap…)
  features/
    auth/
    spaces/
    invites/
    habits/
    checkins/
    challenges/
    dashboard-me/
    dashboard-space/
    dashboard-admin/
  lib/            # supabase client, query keys, date helpers, scoring
  routes/         # route definitions per tab
supabase/
  migrations/     # SQL migrations, ordered
  functions/      # edge functions (email invite send)
```

Feature-first: each feature owns its components, hooks, and queries. Cross-feature logic lives in `lib/`.

### 2.3 Auth model

- Supabase Auth with two providers: **Google OAuth** and **email magic link**.
- On first sign-in a `users` row is created (via trigger on `auth.users`) holding display name, avatar URL, email.
- The app treats `auth.uid()` as the sole identity. No separate credentials.
- Route protection: unauthenticated users are redirected to `/sign-in`; the invite token, if present, is preserved through the auth round-trip (stored in session storage and re-read on return).

### 2.4 Invite token flow

This is the riskiest area and the plan treats it as such.

1. An Admin generates an invite (link type or email type). The server creates an `invites` row with a random opaque `token`, role, optional `expires_at`, optional `max_uses`, and `status = 'active'`.
2. The shareable URL is `/<join>/<token>`. For email invites the same token is emailed with a join button.
3. Opening the link:
   - **Signed in:** the app calls an RPC `accept_invite(token)` that validates status, expiry, and usage count, then creates or updates the membership row with `status = 'active'` (or `'pending'` for request-to-join Spaces).
   - **Not signed in:** the user signs up/signs in; the token is preserved and `accept_invite` runs on return. This covers "someone who isn't signed up yet should sign up and then auto-join."
4. **Matching is by token, not email.** An email invite whose address differs from the Google account used to sign in still works: the token is the credential. Email is notification, not authentication.
5. Usage: each successful accept increments `used_count` atomically. When `used_count >= max_uses` (or the token expires), further attempts fail with a clear, non-leaky error.
6. Revoke/regenerate sets `status = 'revoked'` and creates a new token for regeneration.

### 2.5 Realtime usage

- The **activity feed**, **leaderboard**, and **line chart** subscribe to `checkins` changes filtered by Space (Supabase Realtime on the `checkins` table, with RLS applied to the subscription).
- Realtime is an enhancement, not a correctness dependency: every screen also fetches on mount, and subscriptions fall back to refetch-on-focus if the socket drops.
- Leaderboard is computed from denormalized query results; no scoring is stored in v1 (percentage is derivable), so realtime updates are cheap.

---

## 3. Data model

All tables live in `public` unless noted. Every table includes `created_at timestamptz not null default now()`.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| display_name | text not null | |
| avatar_url | text | |
| email | text not null unique | |

Created by a trigger on `auth.users` insert.

### `spaces`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| description | text | |
| icon | text | emoji or asset key |
| cover_url | text | |
| mode | text not null | `competitive` \| `supportive` \| `mixed` |
| join_policy | text not null default 'invite_only' | `invite_only` \| `request_to_join` |
| owner_id | uuid FK users | |
| settings | jsonb not null default '{}' | e.g. `allow_leaderboard_opt_out` |

### `memberships`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| space_id | uuid FK spaces | |
| user_id | uuid FK users | |
| role | text not null | `owner` \| `admin` \| `member` |
| status | text not null | `active` \| `pending` \| `left` \| `removed` |
| nickname | text | per-Space display name |
| show_on_leaderboard | boolean not null default true | |
| joined_at | timestamptz | |

Unique `(space_id, user_id)`. Exactly one `owner` per Space, enforced by trigger.

### `invites`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| space_id | uuid FK spaces | |
| type | text not null | `link` \| `email` |
| token | text not null unique | opaque, 32+ bytes |
| role | text not null default 'member' | role granted on accept |
| invited_email | text | email type only; notification target, not a gate |
| expires_at | timestamptz | null = no expiry |
| max_uses | integer | null = unlimited |
| used_count | integer not null default 0 | |
| status | text not null | `active` \| `revoked` \| `expired` |
| created_by | uuid FK users | |

### `habits`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| space_id | uuid FK spaces | |
| user_id | uuid FK users | owner of the habit (null for challenge-shared habits) |
| name | text not null | |
| type | text not null | `yes_no` \| `counted` |
| target | integer not null default 1 | for counted habits, per period |
| frequency | text not null | `daily` \| `weekly_x` |
| times_per_week | integer | required when `weekly_x` |
| visibility | text not null | `shared` \| `percentage` \| `private` |
| archived_at | timestamptz | |

### `checkins`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK habits | |
| user_id | uuid FK users | denormalized for RLS and queries |
| space_id | uuid FK spaces | denormalized for query efficiency |
| date | date not null | Space-local date |
| value | integer not null default 1 | 1 for yes/no, count for counted |
| created_at | timestamptz | |

Unique `(habit_id, user_id, date)`.

### `challenges`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| space_id | uuid FK spaces | |
| name | text not null | |
| duration_days | integer not null | 7/21/30/45/60 or custom |
| start_date | date not null | |
| end_date | date not null | check constraint: end >= start |
| habits_mode | text not null | `shared` \| `own` |
| habit_ids | uuid[] | when `shared`: the habits all members track |
| status | text not null | `draft` \| `active` \| `completed` \| `cancelled` |
| created_by | uuid FK users | |

Partial unique index on `(space_id)` where `status = 'active'` to enforce **one active challenge per Space**.

### `badges`
| Column | Type | Notes |
|---|---|---|
| id, user_id, space_id, kind (`streak_7`/`streak_21`/`streak_30`), earned_at | | unique `(user_id, space_id, kind)` |

### `activity_feed`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| space_id | uuid FK spaces | |
| actor_id | uuid FK users | |
| kind | text not null | `checkin` \| `joined` \| `challenge_started` \| `challenge_completed` \| `badge_earned` |
| payload | jsonb | |
| created_at | timestamptz | |

Rows are written by triggers on the relevant tables, not by client code.

### Goals

No `goals` table in v1 (goals are v1.5). The rough model's `goals` is recorded in the backlog.

### 3.1 RLS policy intent

RLS is the security boundary; app code is not trusted to filter.

| Table | Policy intent |
|---|---|
| `users` | Read own row; read rows of users who share an active Space (for names/avatars). Write only own row. |
| `spaces` | Read only if the caller has an `active` or `pending` membership. Insert allowed for any authenticated user (creates owner membership in the same transaction via RPC). Update/delete by owner; update settings by admin. |
| `memberships` | Read memberships of Spaces the caller belongs to. Update `nickname` / `show_on_leaderboard` for self; role/status changes by admin; leave by self. |
| `invites` | Read/write only by owner and admins of the Space. |
| `habits` | Read own habits always. Read others' habits only when `visibility = 'shared'`. Never return `private` or `percentage` habit rows to other members. Write own habits; challenge-shared habits by admin. |
| `checkins` | Read own always. Read others' when the habit is `shared`; for `percentage` habits expose only aggregates via a view/RPC, never raw rows. `private` habit check-ins are never readable by others. |
| `challenges` | Read by Space members. Write by owner/admin. |
| `badges` | Read own; `shared` badge kinds may be read by Space members (needed for the feed). |
| `activity_feed` | Read by Space members. Insert only via triggers. |

**Admins see membership, not private habit details.** No admin bypass may be added to `habits`/`checkins` policies.

For percentage-only visibility, create a SQL view `space_habit_percentages` (security invoker) returning per-user completion ratios, and expose it via RPC. It must never expose habit names or individual check-ins for `percentage` habits.

### 3.2 Scoring (v1)

**Completion percentage** — for a user in a Space's active challenge:

```
completion% = (check-ins meeting target) / (habit-days due so far) × 100
```

- "Habit-days due" accounts for `daily` vs `weekly_x` frequency and excludes days before the challenge start and after today.
- Only habits in challenge scope count. Members who bring their own habits are scored on their own.
- Users with `show_on_leaderboard = false` still see the leaderboard but are omitted from it.
- Percentage is derived at query time (no stored score) so it cannot drift.

---

## 4. Phased plan

Each phase follows the project definition of done in `CLAUDE.md`: typecheck, lint, tests, build green; every acceptance criterion covered by a test; code-reviewer APPROVE; no untracked TODOs.

### Phase 1 — Foundation: auth, Spaces, memberships, invites

**Goal:** the riskiest part works end to end.

**Scope**
- Project scaffold (Vite + TS + Tailwind + router + Query + Supabase client + PWA manifest).
- Migrations for `users`, `spaces`, `memberships`, `invites` and their RLS policies.
- Google and magic-link sign-in, sign-out, session persistence.
- Create Space (name, icon, description, mode, join policy) with the creator as owner.
- Space switcher.
- Invite link generation with optional expiry, max uses, role; revoke and regenerate.
- Email invite send via edge function (provider integration; stubbed if credentials unavailable).
- Join flow: signed-in and signed-out paths; request-to-join pending queue; approve/decline.
- Pending invites panel: invited / joined / expired, resend and cancel.
- Roles and permission checks on the client and in RLS.

**Acceptance criteria**
1. A new user can sign in with Google and with a magic link, and the session survives a reload.
2. Creating a Space makes the creator its `owner` and shows it in the switcher; it appears for no one else.
3. An invite link with `max_uses = 1` admits exactly one new member; the second attempt fails with a clear "this invite has already been used" error and creates no membership.
4. An invite with `expires_at` in the past is rejected with "this invite has expired."
5. A revoked invite is rejected immediately; regenerating produces a new working token and leaves the old one dead.
6. A signed-out visitor opening an invite link signs up and is added to the Space automatically on return.
7. An email invite opened while signed in with a different Google account than the invited address still joins successfully (token matching).
8. A request-to-join Space places link openers in `pending`, and an Admin can approve (membership becomes `active`) or decline.
9. An Admin can remove a member; a Member can leave; neither can remove the Owner.
10. A non-member querying any Space-scoped table through the Supabase client returns zero rows (RLS verified by test).
11. The pending invites panel reflects invited/joined/expired states and resend/cancel actions change state correctly.
12. The app installs as a PWA and loads offline to a shell with a clear offline message.

**Tests:** RLS policy tests as SQL tests against a local Supabase instance (two-user scenarios); component tests for invite forms and the pending panel; e2e invite journey.

**Dependencies/risks:** Supabase project provisioning; Google OAuth credentials; email provider credentials. Email sending is behind an interface so it can be stubbed.

**Out of scope:** habits, check-ins, challenges, dashboards.

### Phase 2 — Habits and check-ins with the Today screen

**Goal:** the daily ritual works.

**Scope**
- CRUD for habits (yes/no and counted; daily and X-times-per-week; visibility).
- Today screen: checklist grouped by Space, tick animation, counted stepper, optimistic updates.
- Check-in upsert and undo for today.
- Per-habit visibility enforced in RLS.
- Streak computation for the current user.
- Percentage aggregation view/RPC foundation.

**Acceptance criteria**
1. A member can create a yes/no daily habit and a counted habit with a target, and both appear on Today.
2. Ticking a habit records a check-in for today; unticking removes it; the UI reflects both without a reload (optimistic, reconciled).
3. A counted habit reaches its target only when `value >= target`; below target shows partial progress and is not counted as complete.
4. A `weekly_x` habit shows progress against the week, not the day, and completion is measured against `times_per_week`.
5. A second member cannot see a `private` habit or its check-ins; cannot see a `percentage` habit's name or individual check-ins.
6. A `shared` habit and its check-ins are visible to other Space members.
7. Check-ins survive a reload and are unique per habit per user per day (a double submit does not duplicate).
8. Ticking the last habit of the day triggers the full-day celebration hook (animation wired; visual polish in Phase 5).
9. Streak counts consecutive completed days and resets on a missed due day.

**Tests:** unit tests for streak and progress math; RLS tests for the three visibility levels; component tests for the checklist; e2e check-in flow.

**Out of scope:** dashboards, challenges, confetti/badges (Phase 5).

### Phase 3 — Me dashboard

**Goal:** personal progress is legible and motivating.

**Scope**
- Rings for today's completion.
- Current streak display.
- Calendar heatmap of the last ~12 weeks across habits.
- Empty state for a new user with no check-ins.

**Acceptance criteria**
1. Rings reflect today's completed vs due habits and update after a check-in without reload.
2. Streak shown matches the streak calculation and displays 0 cleanly for a new user.
3. Heatmap shows one cell per day with intensity from completion, correct weekday alignment, and a legend.
4. A user with no data sees a purposeful empty state, not an empty grid.
5. The dashboard is responsive from 360 px to desktop.

**Tests:** unit tests for ring/heatmap data transforms; component tests for empty state and responsiveness fixtures.

**Out of scope:** insights, goals, trophy room.

### Phase 4 — Challenges and the Space leaderboard

**Goal:** the race exists.

**Scope**
- Challenge creation (presets 7/21/30/45/60 + custom), start/end dates, `shared` vs `own` habits mode.
- One active challenge per Space enforced.
- Space dashboard: leaderboard by completion percentage, line chart race over days, activity feed.
- Leaderboard opt-out (`show_on_leaderboard = false`).
- Final results screen on completion.
- Realtime subscriptions for leaderboard and feed.

**Acceptance criteria**
1. An Admin can start a challenge with a preset or custom duration; `end_date` is derived from `start_date + duration - 1` and cannot precede the start.
2. Starting a second challenge while one is active is rejected with a clear error; it is allowed once the first is completed or cancelled.
3. The leaderboard is ordered by completion percentage descending and uses the scoring formula in §3.2.
4. Supportive-mode Spaces hide ranks and ordering while still showing shared progress.
5. A member with `show_on_leaderboard = false` is absent from the leaderboard but can still view it.
6. The line chart plots each member's percentage over challenge days and matches the leaderboard's final values.
7. The activity feed shows check-ins, joins, challenge start, and completion, updating live without a reload.
8. At `end_date` the challenge becomes `completed` and the results screen shows final standings.
9. Percentage-only habits contribute to the aggregate without revealing habit details.

**Tests:** scoring unit tests incl. weekly habits and partial days; SQL test for the single-active-challenge constraint; RLS tests for percentage aggregation; e2e challenge journey from creation to results.

**Out of scope:** head-to-head, kudos, leagues, points.

### Phase 5 — Animations and delight

**Goal:** the race feels alive.

**Scope**
- Confetti on habit completion; larger burst on a full day.
- Streak milestone badges (7, 21, 30) with a popup.
- Animated leaderboard re-ordering with count-up numbers.
- Motion respects `prefers-reduced-motion`.

**Acceptance criteria**
1. Completing a habit fires the standard confetti; completing the last due habit of the day fires the larger burst.
2. Reaching a 7/21/30 streak shows the matching badge popup exactly once per earned milestone (persisted, not re-triggered on reload).
3. Leaderboard rows animate to new positions and numbers count up on change.
4. With reduced motion enabled, no confetti, count-up, or re-order animation plays and the information remains fully readable.
5. Animations do not cause layout shift and the app remains interactive during them.

**Tests:** component tests for milestone-once semantics and reduced-motion branching; visual regression goldens for the leaderboard.

**Out of scope:** new data behaviors.

### Phase 6 — Admin tab and privacy settings

**Goal:** Admins can run the Space; privacy controls are complete.

**Scope**
- Admin tab: members, invites, challenge setup, Space settings (name, icon, mode, join policy).
- Member management: promote/demote admin, remove, transfer ownership.
- Privacy settings: per-habit visibility, leaderboard opt-out, clear explanation of what Admins can and cannot see.
- Admin cannot see private habit details (verified).
- PWA install prompt and update flow.

**Acceptance criteria**
1. The Admin tab is visible only to owner/admins and every action re-checks permissions server-side.
2. An Admin can promote a member to admin and demote an admin back to member; the Owner cannot be demoted.
3. Ownership transfer moves `owner` atomically: exactly one owner before and after.
4. A member can change a habit's visibility and leaderboard opt-out; the change takes effect on other members' views live.
5. An Admin viewing the Space cannot see any `private` habit's name, check-ins, or percentage.
6. Space settings changes by an Admin take effect for all members.
7. The privacy settings screen states plainly which data each visibility level shares and with whom.

**Tests:** permission matrix tests (owner/admin/member × action), RLS tests for admin access to private habits, e2e admin journey.

**Out of scope:** contacts picker, integrations.

---

## 5. Cross-cutting concerns

- **Dates:** a "day" is a calendar date in the Space's timezone (a `settings.timezone` key, defaulting to the creator's timezone). All check-in dates are stored as dates, never timestamps.
- **Errors:** failed mutations surface a human-readable message and preserve the user's input. No silent catches.
- **Accessibility:** keyboard-operable checkboxes and dialogs, visible focus, labeled controls, reduced-motion support, contrast checked in both themes if a dark theme is added.
- **Performance:** Today and leaderboard must render under ~1 s on a mid-range phone; charts lazy-loaded.
- **Security:** RLS on every table; tokens are opaque and unguessable; no service-role key in the client; email addresses never leaked through error messages.

## 6. Backlog (out of scope for v1)

Recorded so no TODO is left untracked:

- v1.5: head-to-head view, goals with milestones, insights tab, trophy room, kudos and nudges, streak freezes, leagues, push notifications and reminders, points with streak bonuses.
- v2: timed and numeric habits, proof photos, weekly recap cards, Google contacts picker, Strava and Google Fit, native wrapper.
- `goals` table (v1.5).

## 7. Delivery workflow

Plan approved → per phase: implement → test → code review loop → `/ship` (audit + release). Humans approve the plan, any new dependency, any schema/API change, and production deploy. Never push to `main` directly.

---

## 8. Open questions & decisions
 
 | # | Question / Decision | Status / Choice |
 |---|---|---|
 | 1 | **Scoring in v1:** completion percentage or points with streak bonuses? | **Confirmed:** Plain completion percentage (§3.2). |
 | 2 | **Package manager:** npm, pnpm, or yarn? | **Confirmed:** `npm`. |
 | 3 | **Test stack:** Vitest + RTL + Playwright? | Assumed; needs confirmation. |
 | 4 | **Deploy target:** Vercel, Netlify, Cloudflare Pages, other? | **Confirmed:** `Vercel`. |
 | 5 | **Email provider:** Resend, Postmark, SendGrid, other? | Resend assumed; needs an account/API key. |
 | 6 | **Email invites:** locked to the invited address, or forwardable? | The token is the credential, so invites are effectively forwardable (same as link invites). Locking would require an email-match gate. Recommended: forwardable, with Admin visibility into who accepted. |
 | 7 | **Space timezone:** per-Space setting vs. each user's local date? | Per-Space `settings.timezone`, defaulting to the creator's. |
 | 8 | **Dark theme in v1?** | Not specified; omitted from phase criteria. |
