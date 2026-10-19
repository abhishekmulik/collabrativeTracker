# Agent Guidelines: Impeccable UI + Ponytail Code

This repository combines **Impeccable** for frontend UI craft and **Ponytail** for lean code architecture.

---

## 1. UI Craft — Impeccable Standard

Every user-facing interface must feel intentional, polished, and delightful:
- **Visual Distinction:** Design with a clear point of view. Avoid bland, generic boilerplate; align typography, palette, and spacing with `PRODUCT.md` and `DESIGN.md`.
- **Operating Context:** The primary experience is a responsive mobile-first PWA with three core dashboards (**Me**, **Space**, **Admin**) and the daily **Today** checklist.
- **Delight Rituals:** Implement the delight moments defined in the product spec:
  - Satisfying tick animations on habit check-in.
  - Confetti bursts on habit completion (and a bigger burst on a 100% completed day).
  - Streak milestone badges at 7, 21, and 30 days.
  - Smooth leaderboard row re-ordering with count-up percentage animations.
- **Accessibility & Motion:** Support keyboard navigation, high-contrast states, and respect `prefers-reduced-motion` across all animations.
- **Craft Floor:** Review `.claude/skills/impeccable/reference/craft-floor.md` before finalizing UI surfaces.

---

## 2. Code Architecture — Ponytail Framework

The best code is the code never written. Solve the whole problem with the least new code:

### The Decision Ladder
Before writing any new code or adding dependencies, stop at the first rung that holds:
1. **Does this need to exist?** Skip speculative options, config knobs, or flexibility nobody requested.
2. **Already in this codebase?** Reuse existing components, hooks, utilities, and queries. Never duplicate.
3. **Stdlib or platform feature?** Use standard browser APIs and native HTML elements (`<input type="date">`, `<dialog>`, CSS transitions) instead of custom mini-frameworks.
4. **Installed dependency?** Use packages already in `package.json`. Never add a new npm dependency for a handful of lines.
5. **Can it be one line?** If a reader can understand it at a glance, make it one line.
6. **Otherwise:** Write the minimum necessary code that completely works.

### Non-Negotiables (Never Cut)
Under no circumstances should the following be cut in the name of minimalism:
- **Security & RLS:** Supabase Row-Level Security policies ensuring Space data is only visible to Space members, and private habits remain strictly private even from Admins.
- **Trust-boundary validation:** Form and API payload validation (Zod schemas matching database contracts).
- **Data integrity & error handling:** Proper error feedback in the UI; no silent catches that risk data loss.
- **Accessibility:** Semantic HTML, ARIA labels, and keyboard navigability.
- **Explicit user requirements:** Anything the user specifically asks for.

### Coding Practices
- **Deletion beats addition:** Remove obsolete code instead of layering wrappers over it.
- **Root causes over symptom patches:** When fixing a bug, find where the behavior originates and fix it once.
- **Document shortcuts:** If a shortcut has a known future limitation, document it with:
  `// shortcut: <limitation>, <when to upgrade>`

---

## 3. Communication

At the end of implementation responses, include a brief 1-2 line summary:
- What was intentionally skipped or kept minimal (YAGNI).
- Any trade-offs or risks the user should be aware of.
