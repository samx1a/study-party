import Link from "next/link";
import { Logo } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader({ name, guest = false }: { name: string; guest?: boolean }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
            Dashboard
          </Link>
          <Link href="/settings" className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
            {name}
          </Link>
          <SignOutButton guest={guest} />
        </nav>
      </div>
    </header>
  );
}
