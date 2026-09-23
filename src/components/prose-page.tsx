import { Logo } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

export function ProsePage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-display text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
        <div className="mt-10 flex flex-col gap-6 leading-relaxed text-muted [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
