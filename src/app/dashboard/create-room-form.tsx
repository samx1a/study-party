"use client";

import { useActionState } from "react";
import { Button, ErrorText, Input } from "@/components/ui";
import { createRoomAction } from "./actions";

export function CreateRoomForm() {
  const [state, action, pending] = useActionState(createRoomAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="name"
          required
          maxLength={60}
          placeholder="New room name, e.g. CS 170 grind"
          aria-label="Room name"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create room"}
        </Button>
      </div>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
