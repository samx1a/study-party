"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-5xl font-semibold tracking-tight">Something broke</h1>
      <p className="max-w-sm text-muted">Sorry about that. Try again, and if it keeps happening, head back to the dashboard.</p>
      {error.digest && <p className="font-mono text-xs text-muted">Error ID: {error.digest}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
