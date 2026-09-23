# Study Party

**Study together. Cameras on.**

Study Party is a video room for studying with friends. Everyone keeps their
camera on (sharing a screen is optional), a shared Pomodoro timer keeps the room in sync, and
mics lock during focus time. Your study time turns into hours and streaks.

- 📷 **Cameras on**: your camera must be on to join. Turn it off and you're paused, and everyone can see it.
- 🖥️ **Optional screen share**: share a window so friends can see what you're working on.
- 🍅 **Shared timer**: 25/5 focus/break by default, in sync for everyone, with a chime at each switch.
- 🤫 **Quiet focus**: mics are forced off during focus and unlock on the break.
- ✅ **Session goals**: write what you'll finish and check it off. Everyone sees everyone's progress.
- 🙈 **Privacy**: hide your screen for 30s in one click. Nothing is recorded.
- 🔥 **Streaks & hours**: minutes only count while your camera is really on (checked on the server).
- 🔒 **Invite-only rooms**: the link is the invite, and the host can remove people.
- 👋 **No sign-up**: friends type a name and they're in. Accounts are optional, for keeping your streak across devices.

## Tech stack

| Part | Tool |
|---|---|
| App + API | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Video | LiveKit (open-source video server; LiveKit Cloud in production) |
| Database | Postgres + Drizzle ORM |
| Login | Better Auth: guest (name only) by default, optional email + password account |
| Tests | Vitest (unit + database), Playwright (two real browsers with fake cameras) |

How it all fits together, and why, is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
To put it online, follow **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Run it locally

You need Node 20.9+, Postgres, and the LiveKit server.

```bash
# 1. Install tools (macOS)
brew install postgresql@16 livekit
brew services start postgresql@16

# 2. Install packages and create your env file
npm install
cp .env.example .env.local        # then set BETTER_AUTH_SECRET: openssl rand -base64 32

# 3. Create the database and tables
createdb study_party
npm run db:migrate

# 4. Start the video server (terminal 1) and the app (terminal 2)
npm run livekit
npm run dev
```

Open http://localhost:3100, type a name, and make a room. To test with a
"friend", open the room link in a private window and type another name.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app on port 3100 |
| `npm run livekit` | Start a local LiveKit server (key `devkey`, secret `secret`) |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm test` | Unit + database tests (needs `createdb study_party_test && npm run test:db:setup` once) |
| `npm run e2e` | Browser tests: two people run a full session (needs Postgres + LiveKit running) |
| `npm run check` | Lint + typecheck + tests |

## Project layout

```
src/
  app/                 pages and API routes
    api/rooms/[id]/    token, state, timer, goals, kick, settings
    api/heartbeat/     credits study minutes
    r/[id]/            the study room
    dashboard/         stats + your rooms
  components/room/     room UI: pre-join, video grid, timer, goals, controls
  db/schema.ts         database tables
  lib/                 timer + streak logic, LiveKit helpers, auth, room rules
tests/
  unit/                pure logic (timer, streaks)
  integration/         heartbeat + stats against a real database
  e2e/                 Playwright: full two-person session
docs/                  architecture and deploy guides
```

## Status and what's next

See the **Future work** section of [ARCHITECTURE.md](docs/ARCHITECTURE.md#9-future-work).
Top items: password reset emails, Google sign-in, server-enforced muting, and
public rooms with moderation.
