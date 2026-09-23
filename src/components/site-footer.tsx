import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted md:flex-row">
        <p>© {new Date().getFullYear()} Study Party</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-text">
            Terms
          </Link>
          <a href="https://github.com/samx1a/study-party" className="hover:text-text">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
