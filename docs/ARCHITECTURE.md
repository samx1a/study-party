# Study Party — Architecture & System Design

Study Party is a virtual study room. Everyone in a room shows their camera **and**
their screen, the room runs a shared Pomodoro timer, and mics are muted while the
room is focusing. Your study time adds up to hours and streaks.

This doc explains how the pieces fit and why they were picked.

---

## 1. Goals and non-goals

**Goals (v3)**

- Invite-only rooms of up to 12 people, joined with a link.
- Everyone must share a screen to be "in" the room. Stop sharing and you are paused.
- A shared focus/break timer that stays in sync for everyone.
- Mics are locked off during focus and open on breaks.
- Each person sets goals for the session and checks them off.
- A privacy button that hides your screen for 30 seconds.
- Accounts, hours studied, and daily streaks.
- Runs on free tiers, deploys with no servers to babysit.

**Non-goals (for now)**

- Public rooms with strangers (needs moderation tools first).
- Phones (mobile browsers can't share the screen).
- Recording. Rooms are never recorded.

---

## 2. The big picture

```
                ┌──────────────────────────── Browser ─────────────────────────────┐
                │  Next.js pages (React)                                           │
                │   • landing, sign in/up, dashboard, room                         │
                │  livekit-client  ── camera + mic + screen (WebRTC) ──┐           │
                └───────────────┬───────────────────────────────────────┼──────────┘
                                │ HTTPS (JSON, cookies)                 │ media (UDP/TCP)
                                ▼                                       ▼
┌──────────────── Next.js server (Vercel) ───────────────┐   ┌──── LiveKit Cloud (SFU) ────┐
│ Route handlers + server actions                        │   │ Receives each video once and │
│  • /api/auth/*        Better Auth (email + password)   │   │ forwards it to everyone else │
│  • /api/rooms/:id/token   signs LiveKit join tokens ───┼──►│ Room service API:            │
│  • /api/rooms/:id/state   timer + goals + members      │   │  • list/remove participants  │
│  • /api/rooms/:id/timer   start / stop / skip          │   │  • send data to a room       │
│  • /api/rooms/:id/goals   CRUD                          ├──►│                              │
│  • /api/heartbeat     credits study minutes             │   └──────────────────────────────┘
└──────────────────────┬─────────────────────────────────┘
                       │ SQL (Drizzle ORM)
                       ▼
             ┌──── Postgres (Supabase / Neon) ────┐
             │ users, sessions, rooms, members,   │
             │ goals, study_days, presence        │
             └────────────────────────────────────┘
```

There are three moving parts:

1. **Next.js app**: the pages *and* the backend (API routes). One codebase, one deploy.
2. **LiveKit**: the video server. It's an **SFU** (Selective Forwarding Unit), a
   server that takes each person's video once and forwards copies to the others.
   Without it, every laptop would upload its camera and screen to every other
   laptop, which falls over at about 4 people.
3. **Postgres**: stores everything that has to last (accounts, rooms, goals, study time).

Nothing runs all the time on our side. No WebSocket server and no background
jobs, so it fits serverless hosting (Vercel) cleanly.

---

## 3. Key design decisions

### 3.1 Video: LiveKit instead of raw WebRTC

| Option | Verdict |
|---|---|
| Raw WebRTC mesh (peer to peer) | Breaks past 3–4 people. Each person here sends *two* streams (camera + screen). |
| Self-hosted SFU (mediasoup, Janus) | Big ops job: TURN servers, scaling, UDP ports. |
| **LiveKit Cloud** | Open source SFU with a free tier, good React components, and a server SDK. Can self-host later with the same code. |

Locally we run the same server with `livekit-server --dev`.

### 3.2 Keep screen shares cheap

Study screens barely move (a PDF, an IDE). So:

- Screen shares are sent at **5 frames per second**, up to 1080p, with
  `contentHint = "text"` so the encoder keeps text sharp instead of smooth motion.
- **Simulcast**: each screen is sent at 2 quality levels. **Adaptive stream**:
  each viewer only receives the level that fits the tile size on their screen.
  A 12-person grid pulls small, cheap versions. Opening one screen full-size
  pulls the sharp version of just that one.
- **Dynacast**: if nobody is watching a quality level, the sender stops encoding it.
- Cameras are small (360p) picture-in-picture bubbles.

### 3.3 The server is the single source of truth for room events

Clients get LiveKit tokens with `canPublishData: false`. Browsers **cannot**
send data messages into a room. Only our server can (through LiveKit's room
service API). This stops a modified client from faking "timer reset" or
"goal completed" for everyone.

Flow for any room change (timer, goals, settings):

```
Browser ──POST /api/rooms/:id/timer──► Next.js ──UPDATE──► Postgres
                                          │
                                          └─ sendData({type:"room-updated"}) ──► LiveKit ──► every browser
every browser ──GET /api/rooms/:id/state──► Next.js (refetch the fresh state)
```

The data message is only a nudge ("something changed, refetch"). The real
state always comes from the database. Clients also refetch every 30 seconds
in case a nudge is lost. So LiveKit being briefly unreachable never corrupts state.

### 3.4 Timer: stored as a start time, never "ticked"

A room stores `timerStartedAt`, `focusMinutes`, and `breakMinutes`. Nobody
counts down on the server. Every client works out the current phase from those values:

```
elapsed   = now - timerStartedAt
cycle     = focus + break
intoCycle = elapsed mod cycle
phase     = intoCycle < focus ? "focus" : "break"
round     = floor(elapsed / cycle) + 1
```

- It's a pure function (`src/lib/timer.ts`), unit tested.
- **Clock skew**: each state response includes `serverNow`. The client stores
  `offset = serverNow - Date.now()` and uses `Date.now() + offset` as "now". So
  a laptop with a wrong clock still shows the same timer as everyone else.
- **Skip phase**: moves `timerStartedAt` so the next phase starts right now.
- No cron jobs, no drift, and it works even if the server restarts.

### 3.5 Required screen sharing

The browser never lets a site share the screen without the user clicking
"Allow". So "required" means **gated**:

- **Pre-join screen**: you must grant camera and pick a screen/window before
  the "Join" button is enabled.
- **In the room**: if your screen share ends (you clicked "Stop sharing" in
  the browser bar), you get a full "You're paused" overlay until you share again.
  Others see a **Paused** badge on your tile.
- **Study minutes only count while sharing** (checked on the server, see 3.7).

### 3.6 Mic rules

- During **focus**: your mic is forced off and the mic button is disabled.
- During **break** (or when no timer is running): you can unmute.
- This is enforced in the client. The server could also mute tracks with
  `mutePublishedTrack`, but that needs something to run at each phase change
  (a scheduler). Noted in *Future work*.

### 3.7 Study time and streaks

A signed-in client in a room sends `POST /api/heartbeat` every 60 seconds.
The server:

1. Checks the user is in that room *in LiveKit right now* and has a **live,
   unmuted screen share** (asks LiveKit's room service directly). A browser
   can't fake this by just sending heartbeats.
2. Checks the room isn't on a **break**.
3. Looks at the user's `presence.lastBeatAt`. If the last beat was 45–150
   seconds ago, it credits **1 minute**. Beats that come too fast are ignored,
   and a long gap starts fresh (it doesn't back-credit).
4. Adds the minute to `study_days(userId, day)`, where `day` is the date in
   the **user's own time zone**. That way studying at 11pm in California
   counts for that California day.

**Streak** = the number of days in a row, going back from today, with at
least **20 minutes** studied. If today hasn't reached 20 minutes yet, the
streak counts from yesterday, so it doesn't reset at midnight before you've
had a chance to study. Pure function in `src/lib/streak.ts`, unit tested.

### 3.8 Rooms and access

- Room IDs are random 10-character IDs (nanoid, about 59 bits). The link *is*
  the invite, and it can't realistically be guessed.
- You need an account to join. The first time you open a room link, you
  become a **member**.
- The **host** (creator) can change timer lengths, rename the room, and
  **remove** someone. Removing kicks them from LiveKit and bans them from
  getting a new token for that room.
- Max 12 people. The token route checks the live count in LiveKit before
  signing a token. LiveKit's own `maxParticipants` backs this up.

### 3.9 Privacy

- "Hide screen for 30s" **mutes** the screen track (the browser stops sending
  frames). Everyone else sees a "Screen hidden" placeholder. It turns back on
  by itself after 30 seconds, or sooner if you click "Show now".
- The pre-join screen tells people to share **one window**, not the whole screen.
- Nothing is recorded. Video goes browser → LiveKit → browsers and is never stored.

### 3.10 Auth

**Better Auth** with email + password, stored in our own Postgres.

- Why not roll our own: password hashing, session rotation, and CSRF are
  easy to get wrong.
- Why not Clerk/Auth0: one less paid vendor, and the users stay in our database.
- Sessions are HTTP-only cookies. `src/proxy.ts` (Next 16's name for
  middleware) does a fast cookie check to redirect signed-out users. Every
  API route and page still does a real session check against the database.
- Better Auth's built-in rate limiter protects sign-in and sign-up.

---

## 4. Data model

```
user (Better Auth)        session / account / verification (Better Auth)
  id, name, email, timezone

room                                  room_member
  id  (nanoid, = URL)                   roomId ─┐  (PK roomId+userId)
  name                                  userId ─┘
  ownerId → user                        banned (bool)
  focusMinutes (default 25)             joinedAt, lastSeenAt
  breakMinutes (default 5)
  timerStartedAt (null = stopped)     goal
  maxParticipants (default 12)          id, roomId, userId, text, done,
  createdAt                             createdAt, completedAt

study_day                             presence
  userId, day 'YYYY-MM-DD' (PK both)    userId (PK), roomId, lastBeatAt
  minutes
```

Goals show in the room for the **last 12 hours**, so each study session
starts clean without deleting history.

---

## 5. API surface

| Method & path | Who | What |
|---|---|---|
| `*/api/auth/*` | anyone | Better Auth (sign up, sign in, sign out, session) |
| `POST /api/rooms` | signed in | create a room |
| `GET /api/rooms/:id/state` | member | room, timer, members, goals, `serverNow` |
| `POST /api/rooms/:id/token` | member, not banned | LiveKit join token (checks the room isn't full) |
| `POST /api/rooms/:id/timer` | member | `start` / `stop` / `skip` |
| `PATCH /api/rooms/:id` | host | rename, focus/break minutes |
| `POST /api/rooms/:id/kick` | host | remove + ban a participant |
| `POST /api/rooms/:id/goals` | member | add a goal |
| `PATCH/DELETE /api/rooms/:id/goals/:goalId` | goal owner | check off / delete |
| `POST /api/heartbeat` | in room | credit study minute |
| `GET /api/me/stats` | signed in | minutes today, this week, streak |

All inputs are checked with **zod** (a library that validates the shape of data).

---

## 6. Scaling and cost (rough)

- **Video** is the only real cost. LiveKit Cloud bills by participant-minutes.
  A 6-person, 2-hour room = 720 participant-minutes. The free tier covers
  testing with friends. Past that it's pay-as-you-go, or self-host LiveKit
  on one VM.
- **Next.js on Vercel**: API calls are tiny. Heartbeats are 1/min/person, so
  100 people studying at once is about 1.7 requests/second.
- **Postgres**: a few rows per user per day. Free tiers are fine for a long time.
- **Bottleneck to watch**: the heartbeat asks LiveKit about the participant
  each minute. At thousands of concurrent users, switch to **LiveKit webhooks**
  (LiveKit tells us when tracks start/stop) and credit time from those events.

---

## 7. Failure handling

| What breaks | What the user sees |
|---|---|
| Camera/screen permission denied | Pre-join explains how to allow it in browser settings, with a retry button. |
| Wi-Fi drops | LiveKit reconnects on its own. A "Reconnecting…" banner shows. On total failure, a "Rejoin" button. |
| Room full | Friendly "This room is full (12/12)" page. |
| Removed by host | "You were removed from this room" screen. |
| LiveKit down | Token route returns 503. The page shows "Video service unavailable, try again". |
| Unsupported browser (phone) | Pre-join detects missing `getDisplayMedia` and says to use a desktop browser. |

---

## 8. Security checklist

- All room APIs check: signed in → member of the room → not banned → (host for host actions).
- LiveKit tokens: 2-hour TTL, scoped to one room, can publish only camera/mic/screen,
  **cannot** publish data.
- Security headers (CSP-lite, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` allowing camera/mic/display-capture only for our own origin).
- Secrets only on the server (`LIVEKIT_API_SECRET`, `BETTER_AUTH_SECRET`, `DATABASE_URL`).

---

## 9. Future work

- Server-enforced mic muting at phase changes (LiveKit webhooks + a scheduler).
- Email verification and password reset (needs an email provider like Resend).
- Google sign-in (needs OAuth credentials).
- Public "drop-in" rooms with reporting and moderation.
- Heartbeats → LiveKit webhooks at scale.
- Shared rate-limit store (Redis/Upstash). The current limiter is per server instance.
- Error monitoring (Sentry) once there's a DSN.
