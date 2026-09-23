import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function Page() {
  const session = await getSession();
  if (session && !session.user.isAnonymous) redirect("/dashboard");
  return (
    <Suspense>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
