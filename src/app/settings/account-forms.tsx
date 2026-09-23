"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export function AccountForms({
  name,
  email,
  timezone,
  guest,
}: {
  name: string;
  email: string;
  timezone: string;
  guest: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pwMsg, setPwMsg] = useState<{ ok?: string; error?: string }>({});
  const [delError, setDelError] = useState<string>();

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await authClient.updateUser({
      name: String(f.get("name")).trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setMsg(
      error ? { error: error.message ?? "Couldn't save." } : { ok: "Saved." },
    );
    router.refresh();
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const { error } = await authClient.changePassword({
      currentPassword: String(f.get("current")),
      newPassword: String(f.get("next")),
      revokeOtherSessions: true,
    });
    if (error)
      setPwMsg({ error: error.message ?? "Couldn't change password." });
    else {
      setPwMsg({ ok: "Password changed. Other devices were signed out." });
      form.reset();
    }
  }

  async function deleteAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        "Delete your account, rooms you host, and all study history? This can't be undone.",
      )
    )
      return;
    const f = new FormData(e.currentTarget);
    const { error } = await authClient.deleteUser({
      password: String(f.get("password")),
    });
    if (error) {
      setDelError(error.message ?? "Couldn't delete your account.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card>
        <h2 className="font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={name}
              required
              maxLength={50}
            />
          </div>
          {!guest && (
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted">{email}</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Time zone</Label>
            <p className="text-sm text-muted">
              {timezone}. Your study days follow this. It updates to this
              device&apos;s zone when you save or join a room.
            </p>
          </div>
          {msg.ok && <p className="text-sm text-break">{msg.ok}</p>}
          <ErrorText>{msg.error}</ErrorText>
          <Button type="submit" className="self-start">
            Save
          </Button>
        </form>
      </Card>

      {guest ? (
        <Card>
          <h2 className="font-semibold">You&apos;re a guest</h2>
          <p className="mt-1 text-sm text-muted">
            Your rooms, goals, and streak are saved in this browser only. Create
            a free account to keep them on any device. Everything you&apos;ve
            done so far comes with you.
          </p>
          <Link
            href="/sign-up?next=/dashboard"
            className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
          >
            Create an account →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="font-semibold">Password</h2>
            <form
              onSubmit={changePassword}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  name="current"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="next">New password</Label>
                <Input
                  id="next"
                  name="next"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {pwMsg.ok && <p className="text-sm text-break">{pwMsg.ok}</p>}
              <ErrorText>{pwMsg.error}</ErrorText>
              <Button type="submit" variant="secondary" className="self-start">
                Change password
              </Button>
            </form>
          </Card>

          <Card className="border-danger/30">
            <h2 className="font-semibold text-danger">Delete account</h2>
            <p className="mt-1 text-sm text-muted">
              Removes your account, rooms you host, your goals, and your study
              history.
            </p>
            <form onSubmit={deleteAccount} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="del-password">Confirm with your password</Label>
                <Input
                  id="del-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <ErrorText>{delError}</ErrorText>
              <Button type="submit" variant="danger" className="self-start">
                Delete my account
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
