# Next steps

Everything for "version 3" is built and tested: accounts, rooms, required screen
sharing, shared timer, focus mic lock, goals, hide-screen, host controls, study
hours, streaks, landing/privacy/terms pages, CI, and end-to-end tests.

## Needs you (accounts and clicks I can't do)

- [ ] **Deploy it.** Create Supabase, LiveKit Cloud, and Vercel accounts, then follow [DEPLOY.md](DEPLOY.md) (~20 min).
- [ ] **Real-world test** with 3–5 friends on different networks and browsers (Chrome, Safari, Firefox). Fake cameras in tests can't catch everything, like school Wi-Fi blocking video.
- [ ] **Buy a domain** (optional), about $12/year.

## Worth building next

| Feature | Why | Needs |
|---|---|---|
| Password reset + email verification | People forget passwords | An email provider (Resend has a free tier) |
| Google sign-in | Faster sign-up for students | Google OAuth credentials |
| Error monitoring | Know when real users hit bugs | A Sentry account (free tier) |
| Server-enforced muting | Mic lock is client-side today, so a modified browser could skip it | LiveKit webhooks + a scheduled job |
| Shared rate limiter for our own APIs | Login is rate-limited in the database; room APIs aren't | Upstash Redis (free tier) |
| Room list shows who's studying now | Makes the dashboard feel alive | One LiveKit call per room, or webhooks |
| Public drop-in rooms | Growth beyond friend groups | Reporting, moderation, blocking |

## Known limits

- Desktop browsers only (phones can't share screens).
- Up to 12 people per room (set in the database per room, `max_participants`).
- A study minute is only credited when the server confirms your screen share
  is live, the room isn't on a break, and heartbeats arrive about once a minute.
  Background tabs in some browsers slow timers down, which can skip a minute here and there.
