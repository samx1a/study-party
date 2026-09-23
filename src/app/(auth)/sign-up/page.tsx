import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign up" };

export default async function Page() {
  if (await getSession()) redirect("/dashboard");
  return (
    <Suspense>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
