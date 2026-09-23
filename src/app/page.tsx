import Link from "next/link";
import { ButtonLink, Logo } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const signedIn = !!session && !session.user.isAnonymous;

  return (
    <>
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/dashboard" size="sm">
                Start studying
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center md:pt-24">
          <p className="mx-auto w-fit rounded-full border border-border px-3 py-1 text-xs text-muted">
            Free · No sign-up · No downloads
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[1.05] md:text-7xl">
            Study together.
            <br />
            <span className="text-accent">Screens on.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            A video room where everyone shares their camera and their screen. A shared focus timer keeps the
            group quiet, then lets you talk on breaks. No more &quot;studying&quot; on TikTok.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/dashboard" size="lg">
              Start a study room
            </ButtonLink>
            <ButtonLink href="#how" variant="secondary" size="lg">
              How it works
            </ButtonLink>
          </div>

          <RoomMock />
        </section>

        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="grid size-10 place-items-center rounded-xl bg-accent/15 text-lg">{f.icon}</div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-4xl scroll-mt-8 px-4 py-20">
          <h2 className="text-center font-display text-4xl md:text-5xl">Three steps. Zero setup.</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-surface p-6">
                <span className="font-mono text-sm text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-24">
          <div className="rounded-3xl border border-border bg-surface p-8 md:p-12">
            <h2 className="font-display text-3xl md:text-4xl">Built with your privacy in mind</h2>
            <ul className="mt-6 grid gap-4 text-sm text-muted md:grid-cols-2">
              <li>
                <strong className="text-text">Nothing is recorded.</strong> Video goes straight to the people in
                your room and is never stored.
              </li>
              <li>
                <strong className="text-text">Share one window.</strong> Pick your notes or IDE, not your whole
                screen, so texts and tabs stay private.
              </li>
              <li>
                <strong className="text-text">Hide in one click.</strong> Need to check something? Hide your
                screen for 30 seconds.
              </li>
              <li>
                <strong className="text-text">Invite-only rooms.</strong> Only people with your link can join, and
                the host can remove anyone.
              </li>
            </ul>
            <Link href="/privacy" className="mt-6 inline-block text-sm text-accent hover:underline">
              Read the privacy policy →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

const FEATURES = [
  {
    icon: "🖥️",
    title: "Screens on",
    body: "Everyone shares a window. If you stop, you're paused, and your friends can see it.",
  },
  {
    icon: "🍅",
    title: "One shared timer",
    body: "25 minutes of focus, 5 minutes of break, in sync for the whole room.",
  },
  {
    icon: "🤫",
    title: "Quiet by default",
    body: "Mics lock during focus. Catch up with friends on the break.",
  },
  {
    icon: "🔥",
    title: "Streaks & hours",
    body: "Study time only counts while your screen is shared. Keep the streak alive.",
  },
];

const STEPS = [
  { title: "Create a room", body: "Name it after your class or study group. It takes five seconds." },
  { title: "Send the link", body: "Friends type their name and join. No account needed. Works in Chrome, Edge, Firefox, or Safari on a computer." },
  { title: "Start focus", body: "Share a window, set your goals, hit start. The timer does the rest." },
];

// A static picture of the room UI, drawn in HTML so it stays sharp and light.
function RoomMock() {
  const people = [
    { name: "Maya", lines: [80, 65, 90, 40, 70], kind: "doc" },
    { name: "Jordan", lines: [50, 70, 35, 85, 60], kind: "code" },
    { name: "Priya", lines: [90, 75, 55, 80, 45], kind: "doc" },
    { name: "Sam", lines: [0], kind: "paused" },
  ];
  return (
    <div
      aria-hidden
      className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-2xl shadow-accent/5"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">CS 61B grind</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
            Focus · 2
          </span>
          <span className="font-mono text-lg font-semibold">18:42</span>
        </span>
        <span className="text-xs text-muted">4 studying</span>
      </div>
      <div className="h-0.5 bg-border">
        <div className="h-full w-1/4 bg-accent" />
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        {people.map((p) => (
          <div key={p.name} className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg">
            {p.kind === "paused" ? (
              <div className="flex size-full items-center justify-center text-xs text-warn">⏸ Paused, not sharing</div>
            ) : (
              <div className={p.kind === "code" ? "space-y-2 p-4 font-mono" : "space-y-2 p-4"}>
                {p.lines.map((w, i) => (
                  <div
                    key={i}
                    className={p.kind === "code" && i % 2 ? "ml-4 h-2 rounded-full bg-break/40" : "h-2 rounded-full bg-muted/30"}
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px]">{p.name}</span>
            <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full border-2 border-bg bg-surface-2 text-[10px] font-semibold text-muted md:size-12">
              {p.name[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
