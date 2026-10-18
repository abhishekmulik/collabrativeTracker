# Collaborative Habit Tracker: MVP Scope and Plan

## Overview
A shared, competitive habit tracker built around Spaces. Decisions so far: web-first installable PWA, invites by link and email at launch, Google contacts picker deferred until after the MVP.

## MVP (v1): Spaces, Check-ins, and the Race

### Accounts and Spaces
- Sign in with Google (plus email magic link)
- Create a Space, with Owner, Admin, and Member roles
- Invite link (with expiry and max uses) and email invite, plus a pending invites panel
- Space switcher

### Habits and Check-ins
- Yes/no and counted habits, daily or X-times-per-week
- Today checklist with a satisfying tick animation
- Per-habit visibility: shared, percentage only, or private

### Challenges
- Presets of 7, 21, 30, 45, and 60 days, plus custom
- Start date, end date, and a final results screen
- Admin picks shared habits or lets members bring their own

### Dashboards (3 tabs to start)
1. Me: rings, streak, calendar heatmap
2. Space: leaderboard by completion percentage, line chart race, activity feed
3. Admin: members, invites, challenge setup

### Delight Features
- Confetti on completing a habit, with a bigger burst for a full day
- Streak milestones (7, 21, 30) with a badge popup
- Animated leaderboard re-ordering, with count-up numbers

### Future Releases
**v1.5**
- Head-to-head view, goals with milestones, insights tab, trophy room
- Kudos and nudges, streak freezes, leagues
- Push notifications and reminders
- Points with streak bonuses

**v2**
- Timed and numeric habits, proof photos, weekly recap cards
- Google contacts picker, Strava and Google Fit integrations
- Native wrapper if the PWA isn't enough

## Challenge Durations
- 7 days: a trial run for new Spaces.
- 21 days: the default for forming a habit, and a good first challenge.
- 30 days: the flagship, the one people will recognize and share.
- 45 and 60 days: serious mode, with streak freezes enabled by default since long runs need forgiveness.

## Space Model
- Create a Space: name, icon or cover, description, and a mode: Competitive (leaderboards and ranks), Supportive (shared progress, no ranking), or Mixed.
- Roles: the Owner creates the Space and can delete or transfer it; Admins invite and remove members, start challenges, and edit settings; Members track habits, cheer others on, and can leave at any time.
- Multiple Spaces per person: Gym buddies, Family, and Office can each have different habits, visibility, and leaderboards.
- Per-Space profile: a different nickname or visible habit set in each Space.

## Invite Flows
1. Invite link: admin generates a link with optional expiry, usage limit, and role. It can be revoked or regenerated.
2. Email invite: admin types an address (Gmail or any other); the invitee gets an email with a join button.
3. Join requests: if the Space is request-to-join, people opening the link land in a pending queue for the admin to approve or decline.
4. Pending invites panel: invited, joined, or expired, with resend and cancel.
5. Google contacts picker (to be implemented later).

## Privacy Inside a Space
- Per-habit visibility: shared with the Space, percentage only, or private.
- Option to hide from the leaderboard while still seeing others.
- Admins see membership, not private habit details.

## Data Model
- users
- spaces (owner, mode, settings)
- memberships (user, space, role, status, joinedAt)
- invites (space, type: link or email, token, role, expiresAt, maxUses, status)
- habits (owner, space, type, frequency, visibility)
- checkins (habit, date, value)
- challenges (space, duration, start and end dates, rules)
- goals, badges, activity_feed

Row-level rules should ensure a Space's data is readable only by its members.

## Suggested Stack
- React + TypeScript + Vite, with a PWA plugin
- Tailwind and Framer Motion for UI and animations
- Recharts for graphs
- Supabase: Postgres with row-level security, Google auth, and realtime for the live feed
- A transactional email service such as Resend for invites

## Build Order
1. Auth, Spaces, memberships, and invites (the foundation and the riskiest part).
2. Habits and check-ins with the Today screen.
3. Me dashboard (rings, heatmap).
4. Challenges and the Space leaderboard.
5. Animations and polish.
6. Admin tab and privacy settings.

## Open Decisions
Scoring in v1: plain completion percentage (simple, fair across different habit counts) or points with streak bonuses (more game-like, harder to balance). Recommendation: percentage for v1, with points arriving in v1.5.