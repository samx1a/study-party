"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-redirect";

// No sign-up: type a name and you're in. We create a guest account behind the scenes.
export function GuestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const joiningRoom = next.startsWith("/r/");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const name = String(new FormData(e.currentTarget).get("name")).trim();

    const signIn = await authClient.signIn.anonymous();
    if (signIn.error) {
      setPending(false);
      setError(signIn.error.status === 429 ? "Too many tries. Wait a minute." : "Couldn't start. Try again.");
      return;
    }
    await authClient.updateUser({ name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    router.replace(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="text-3xl font-semibold tracking-tight">
        {joiningRoom ? "Join the room" : "What should we call you?"}
      </h1>
      <p className="mt-1 text-sm text-muted">No account needed. Your friends will see this name.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={50}
            autoComplete="given-name"
            autoFocus
            placeholder="Ada"
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" size="lg" disabled={pending} data-testid="guest-continue">
          {pending ? "One sec…" : "Continue"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Have an account?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(next)}`}
          className="text-text underline underline-offset-4 hover:text-accent-ink"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
