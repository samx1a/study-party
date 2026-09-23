import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GuestForm } from "@/components/guest-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Join" };

export default async function JoinPage(props: PageProps<"/join">) {
  const { next } = await props.searchParams;
  if (await getSession())
    redirect(
      typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
    );
  return (
    <Suspense>
      <GuestForm />
    </Suspense>
  );
}
