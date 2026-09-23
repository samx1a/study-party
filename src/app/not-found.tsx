import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <Logo className="mb-6" />
      <h1 className="text-5xl font-semibold tracking-tight">Nothing here</h1>
      <p className="max-w-sm text-muted">
        This page or room doesn&apos;t exist. If a friend sent you a link, check it was copied fully.
      </p>
      <ButtonLink href="/dashboard" className="mt-4">
        Go to dashboard
      </ButtonLink>
    </main>
  );
}
