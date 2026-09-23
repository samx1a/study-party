"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ErrorText, Input, Label } from "@/components/ui";
import type { RoomState } from "@/lib/room-types";

export function SettingsDialog({
  room,
  open,
  onClose,
  onSaved,
}: {
  room: RoomState["room"];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(undefined);
    const res = await fetch(`/api/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(f.get("name")),
        focusMinutes: Number(f.get("focus")),
        breakMinutes: Number(f.get("break")),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
      return;
    }
    onSaved();
    onClose();
  }

  async function deleteRoom() {
    if (!confirm("Delete this room for everyone? This can't be undone.")) return;
    const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/dashboard");
    else setError("Couldn't delete the room.");
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-text backdrop:bg-black/60"
    >
      <h2 className="font-display text-3xl">Room settings</h2>
      <p className="mt-1 text-sm text-muted">Only you (the host) can change these.</p>
      <form onSubmit={save} className="mt-6 flex flex-col gap-4" key={String(open)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room-name">Name</Label>
          <Input id="room-name" name="name" defaultValue={room.name} required maxLength={60} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="focus">Focus (minutes)</Label>
            <Input id="focus" name="focus" type="number" min={5} max={120} defaultValue={room.focusMinutes} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="break">Break (minutes)</Label>
            <Input id="break" name="break" type="number" min={1} max={60} defaultValue={room.breakMinutes} required />
          </div>
        </div>
        <p className="text-xs text-muted">Changing the lengths restarts a running timer from the top of focus.</p>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-between gap-2 pt-2">
          <Button type="button" variant="danger" onClick={deleteRoom}>
            Delete room
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
