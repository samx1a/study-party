"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui";

export function SignOutButton({ guest }: { guest: boolean }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (
          guest &&
          !confirm(
            "You're a guest, so signing out loses your rooms and streak. Create an account first to keep them. Sign out anyway?",
          )
        )
          return;
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
