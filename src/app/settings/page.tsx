import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/session";
import { AccountForms } from "./account-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireUser("/settings");
  return (
    <>
      <AppHeader name={me.name} guest={!!me.isAnonymous} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
        <AccountForms name={me.name} email={me.email} timezone={me.timezone ?? "UTC"} guest={!!me.isAnonymous} />
      </main>
    </>
  );
}
