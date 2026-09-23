"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-redirect";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const { error } =
      mode === "sign-up"
        ? await authClient.signUp.email({
            name: String(form.get("name")).trim(),
            email,
            password,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
        : await authClient.signIn.email({ email, password });

    if (error) {
      setPending(false);
      setError(
        error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : (error.message ?? "Something went wrong. Try again."),
      );
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const isSignUp = mode === "sign-up";
  const otherHref = `${isSignUp ? "/sign-in" : "/sign-up"}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <Card>
      <h1 className="text-3xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-muted">
        {isSignUp ? "Free. Takes 20 seconds." : "Sign in to join your study room."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {isSignUp && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={50} autoComplete="name" placeholder="Ada Lovelace" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@school.edu" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={isSignUp ? "At least 8 characters" : ""}
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "One sec…" : isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={otherHref} className="text-text underline underline-offset-4 hover:text-accent-ink">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </Card>
  );
}
