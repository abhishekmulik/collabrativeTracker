# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite with a PWA plugin; Tailwind and Framer Motion for UI and animation; Recharts for charts; Supabase (Postgres with row-level security, Google auth, realtime) as the backend; a transactional email service such as Resend for invites. Deploy target is not yet decided.

## Users

Small private groups who already know each other — friends and family, gym buddies, and office or team groups. Each group uses one or more Spaces to stay accountable together. Every audience is served by the same product; the Space's mode (Competitive, Supportive, or Mixed) is what adapts the experience to the group rather than separate products per audience.

## Product Purpose

A shared, competitive habit tracker built around Spaces. People create or join a private Space, track habits with daily check-ins, and run timed challenges together. Success means a group finishes a challenge together with members checking in consistently, and the group comes back for the next challenge.

## Positioning

Progress is visible inside a private Space in real time, so accountability comes from a small group of people you actually know racing through the same timed challenge — not from a solo streak or a public social feed. The live race among people you know is the mechanism a neighboring habit tracker could not truthfully claim.

## Operating Context

- The core daily ritual is a "Today" checklist: members check off yes/no or counted habits each day, with a satisfying tick animation.
- Challenges are the unit of group activity: presets of 7, 21, 30, 45, and 60 days plus custom, with a start date, end date, and a final results screen. An Admin either picks shared habits or lets members bring their own.
- 7 days is a trial run for new Spaces; 21 days is the default for forming a habit; 30 days is the flagship; 45 and 60 days are "serious mode."
- People belong to multiple Spaces at once (Gym buddies, Family, Office), each with different habits, visibility, and leaderboards, and a per-Space nickname or visible habit set.
- Roles: Owner creates the Space and can delete or transfer it; Admins invite and remove members, start challenges, and edit settings; Members track habits, cheer others on, and can leave at any time.
- Invites happen by link (with optional expiry, usage limit, role; revocable and regenerable) and by email, with a pending-invites panel showing invited, joined, or expired states. Spaces may be request-to-join, in which case link openers enter an admin approval queue.
- Privacy inside a Space is per habit: shared with the Space, percentage only, or private. Members can hide themselves from the leaderboard while still seeing others. Admins see membership, not private habit details.
- Delight moments are part of the ritual: confetti on completing a habit with a bigger burst for a full day, streak-milestone badge popups at 7, 21, and 30, and animated leaderboard re-ordering with count-up numbers.

## Capabilities and Constraints

Confirmed for v1:

- Google sign-in plus email magic link.
- Accounts, Spaces, memberships (Owner / Admin / Member), and the invite flows described above.
- Yes/no and counted habits, daily or X-times-per-week.
- Today checklist, per-habit visibility, streaks.
- Challenges with the preset durations plus custom, start/end dates, and a final results screen.
- Three dashboard tabs: Me (rings, streak, calendar heatmap), Space (leaderboard by completion percentage, line-chart race, activity feed), Admin (members, invites, challenge setup).
- Web-first installable PWA. Mobile web is web; a native wrapper is deferred to v2 if the PWA proves insufficient.
- Row-level rules must ensure a Space's data is readable only by its members.

Explicitly deferred: Google contacts picker, head-to-head view, goals with milestones, insights tab, trophy room, kudos and nudges, streak freezes, leagues, push notifications and reminders, points with streak bonuses, timed and numeric habits, proof photos, weekly recap cards, Strava and Google Fit integrations.

Undecided product facts:

- Scoring in v1: plain completion percentage (recommended in the plan) or points with streak bonuses. Percentage is the working assumption for v1, not a confirmed decision.
- How to handle an invite email that differs from the Google account used to sign in.
- Whether email invites are bound to the invited address or may be forwarded.
- Whether a Space may have more than one active challenge at a time.

## Evidence on Hand

No real content, assets, testimonials, customer names, benchmarks, or usage data exist yet. Future work must not fabricate any of these. The only source material is `docs/PLAN.md` and `docs/PLAN_SUMMARY.md`, which are product plans, not proof.

## Product Principles

1. **The group is the unit, not the individual.** Every feature should make a small group's shared progress visible and worth returning to; solo tracking is the substrate, not the product.
2. **The Space adapts to the group.** Competitive, Supportive, and Mixed modes and per-habit privacy exist so one product can serve a gym crew and a family without forcing either into the other's culture.
3. **Momentum is designed.** Check-ins, streaks, challenges, and celebration moments are the retention engine; they deserve the same rigor as data correctness.
4. **Privacy is structural, not a setting.** A Space's data is readable only by its members, and private habit details are never exposed to Admins.
5. **Finish the arc.** Challenges have a start, an end, and a results moment; the product should always make the finish visible.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established. The product is a web PWA, so standard web accessibility expectations apply to future work.
