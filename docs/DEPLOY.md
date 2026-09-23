# Deploying Study Party

This puts the app on the internet for free. It takes about 20 minutes. You'll
set up three accounts:

| Service | What it does | Cost to start |
|---|---|---|
| **Supabase** (or Neon) | Hosts the Postgres database | Free tier |
| **LiveKit Cloud** | Runs the video server | Free tier |
| **Vercel** | Hosts the Next.js app | Free (Hobby) |

---

## 1. Database (Supabase)

1. Go to https://supabase.com, sign in with GitHub, and click **New project**.
   Pick a region close to you (e.g. *West US*). Save the database password.
2. Open **Connect** (top of the project page) → **Connection string** → choose
   **Transaction pooler**. Copy the URL. It looks like:
   `postgres://postgres.abcd:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
3. Replace `[PASSWORD]` with your database password. This is your `DATABASE_URL`.
4. Create the tables from your laptop:

   ```bash
   DATABASE_URL="<the url from step 3>" npx drizzle-kit migrate
   ```

   > A **pooler** is a middleman that shares a few database connections among
   > many short-lived requests. Serverless hosting like Vercel needs one. The app
   > already sets `prepare: false`, which poolers require.

## 2. Video (LiveKit Cloud)

1. Go to https://cloud.livekit.io and create a project.
2. Open **Settings → API Keys** → **Create key**. Copy the **API key** and **secret**.
3. Copy your project URL. It looks like `wss://study-party-abc123.livekit.cloud`.
4. You now have:
   - `LIVEKIT_API_KEY` = the key
   - `LIVEKIT_API_SECRET` = the secret
   - `NEXT_PUBLIC_LIVEKIT_URL` = `wss://study-party-abc123.livekit.cloud`
   - `LIVEKIT_URL` = the same URL, but starting with `https://` instead of `wss://`

## 3. App (Vercel)

1. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**,
   and import `samx1a/study-party`.
2. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | from step 1 |
   | `BETTER_AUTH_SECRET` | run `openssl rand -base64 32` and paste the result |
   | `BETTER_AUTH_URL` | your site URL, e.g. `https://study-party.vercel.app` |
   | `LIVEKIT_API_KEY` | from step 2 |
   | `LIVEKIT_API_SECRET` | from step 2 |
   | `LIVEKIT_URL` | from step 2 (`https://…`) |
   | `NEXT_PUBLIC_LIVEKIT_URL` | from step 2 (`wss://…`) |

3. Click **Deploy**. When it's done, Vercel shows your URL.
4. If your URL differs from what you put in `BETTER_AUTH_URL`, fix that
   variable and click **Redeploy**. Sign-in won't work until they match.

## 4. Try it

1. Open your site, sign up, and create a room.
2. Open the room link in another browser (or send it to a friend) and join.
3. Start the timer. Both screens should switch to Focus within a second.

## 5. Optional: your own domain

In Vercel: **Settings → Domains → Add**, then follow the DNS steps it shows
(a domain costs about $12/year from Namecheap, Cloudflare, etc.). Update
`BETTER_AUTH_URL` to the new domain and redeploy.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid or missing environment variables" in Vercel logs | A variable is missing or misspelled. Check all 7. |
| Sign-in fails or loops | `BETTER_AUTH_URL` must exactly match the URL in the address bar (https, no trailing slash). |
| "The video service is unavailable" | Check `LIVEKIT_URL` starts with `https://` and the key/secret are right. |
| Video never connects | Check `NEXT_PUBLIC_LIVEKIT_URL` starts with `wss://`. You must **redeploy** after changing any `NEXT_PUBLIC_` variable. |
| Mac says screen sharing is blocked | System Settings → Privacy & Security → Screen Recording → allow your browser, then restart it. |
| Database errors about prepared statements | Use the **Transaction pooler** URL (port 6543), not the direct one. |
