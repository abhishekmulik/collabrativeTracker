# Plan Summary for Collaborative Habit Tracker MVP

## Phases
1. **Auth, Spaces, memberships, and invites**: Core foundational features for user authentication and Space management.
2. **Habits and check-ins**: Implementation of habit tracking and check-in functionality for users.
3. **Me dashboard**: Development of the dashboard to display personal statistics (rings, heatmap).
4. **Challenges and the Space leaderboard**: This phase will focus on creating challenges and the competitive aspect of the tracker, including the leaderboard.
5. **Animations and polish**: Enhancements to the UI for a more engaging user experience.
6. **Admin tab and privacy settings**: Completing features for admins, including member management and privacy controls.

## Key Decisions
- User authentication via Google and email magic links.
- Different roles within Spaces (Owner, Admin, Member) to manage permissions effectively.
- Implementation of challenges with flexible durations (7, 21, 30, 45, and 60 days).
- Choice of a percentage-based scoring system for v1, with potential inclusion of points later in v1.5.
- Utilization of a web-first approach with a PWA for installation and usage.

## Open Questions
- How will the app handle cases where the invited email differs from the Google account used for sign-in?
- Should email invites be restricted to the invited address, or is forwarding permissible?
- Determining whether to allow multiple active challenges per Space and what the implications of that would be.
- Deciding on the mechanics and balance for point systems versus completion percentages in subsequent versions.