import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-bg hover:bg-primary-hover font-medium",
  secondary: "bg-surface-2 text-text hover:bg-border font-medium",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
  danger: "text-danger hover:bg-danger/10 font-medium",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-9 px-4 text-sm rounded-[10px] gap-2",
  lg: "h-11 px-5 text-[15px] rounded-xl gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-[15px] text-text",
        "placeholder:text-muted/70 focus:border-accent-ink/50 focus:ring-4 focus:ring-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-text", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-surface p-6", className)} {...props} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-bg">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2M9 2h6" strokeLinecap="round" />
        </svg>
      </span>
      <span>Study Party</span>
    </Link>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}
