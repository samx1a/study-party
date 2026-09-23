// Only allow same-site paths like "/r/abc". Blocks "//evil.com" and "https://evil.com".
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
