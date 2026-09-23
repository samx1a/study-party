"use client";

import { useParticipants } from "@livekit/components-react";
import { useState } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { GOAL_MAX_LENGTH, type RoomGoal } from "@/lib/room-types";

type Props = {
  roomId: string;
  meId: string;
  goals: RoomGoal[];
  onChange: (goals: RoomGoal[]) => void;
  refresh: () => void;
};

export function GoalsPanel({ roomId, meId, goals, onChange, refresh }: Props) {
  const participants = useParticipants();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mine = goals.filter((g) => g.userId === meId);

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't save. Try again.");
    }
    refresh();
    return res.ok;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setError(null);
    setText("");
    if (!(await call(`/api/rooms/${roomId}/goals`, { method: "POST", body: JSON.stringify({ text: value }) }))) {
      setText(value);
    }
  }

  // Optimistic: flip it locally right away, then let the refetch confirm.
  function toggle(g: RoomGoal) {
    onChange(goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)));
    call(`/api/rooms/${roomId}/goals/${g.id}`, { method: "PATCH", body: JSON.stringify({ done: !g.done }) });
  }

  function remove(g: RoomGoal) {
    onChange(goals.filter((x) => x.id !== g.id));
    call(`/api/rooms/${roomId}/goals/${g.id}`, { method: "DELETE" });
  }

  // Everyone else who's here now, plus anyone who left goals earlier this session.
  const others = new Map<string, { name: string; goals: RoomGoal[]; here: boolean }>();
  for (const p of participants) {
    if (p.identity !== meId) others.set(p.identity, { name: p.name || "Someone", goals: [], here: true });
  }
  for (const g of goals) {
    if (g.userId === meId) continue;
    const entry = others.get(g.userId) ?? { name: g.userName, goals: [], here: false };
    entry.goals.push(g);
    others.set(g.userId, entry);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border p-4" data-testid="goals">
      <section>
        <h2 className="text-sm font-semibold">Your goals</h2>
        <p className="mt-0.5 text-xs text-muted">What will you finish this session?</p>
        <form onSubmit={add} className="mt-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={GOAL_MAX_LENGTH}
            placeholder="e.g. Finish problem set 3"
            aria-label="New goal"
            data-testid="goal-input"
          />
        </form>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <ul className="mt-3 flex flex-col gap-1">
          {mine.map((g) => (
            <li key={g.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
              <button
                onClick={() => toggle(g)}
                aria-label={g.done ? "Mark not done" : "Mark done"}
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                  g.done ? "border-break bg-break text-bg" : "border-muted",
                )}
              >
                {g.done && <CheckIcon className="size-3" />}
              </button>
              <span className={cn("flex-1 text-sm", g.done && "text-muted line-through")}>{g.text}</span>
              <button
                onClick={() => remove(g)}
                aria-label="Delete goal"
                className="text-muted opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Everyone</h2>
        {others.size === 0 && <p className="mt-1 text-xs text-muted">Invite friends with the link at the top.</p>}
        <ul className="mt-3 flex flex-col gap-4">
          {[...others.entries()].map(([id, o]) => (
            <li key={id}>
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className={cn("size-1.5 rounded-full", o.here ? "bg-break" : "bg-muted")} />
                {o.name}
                {!o.here && <span className="text-xs font-normal text-muted">left</span>}
              </p>
              {o.goals.length === 0 ? (
                <p className="mt-1 pl-3.5 text-xs text-muted">No goals yet</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-0.5 pl-3.5">
                  {o.goals.map((g) => (
                    <li key={g.id} className={cn("text-sm", g.done ? "text-muted line-through" : "text-text")}>
                      {g.done ? "✓ " : "○ "}
                      {g.text}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
