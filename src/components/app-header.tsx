import Link from "next/link";
import { Logo } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader({ name, guest = false }: { name: string; guest?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text"
          >
            {name}
          </Link>
          <SignOutButton guest={guest} />
        </nav>
      </div>
    </header>
  );
}
