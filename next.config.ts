import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// The browser talks to LiveKit directly for video, so allow its host (plus LiveKit
// Cloud's regional hosts) for WebSocket and HTTPS connections.
function livekitSources() {
  const raw = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const sources = ["wss://*.livekit.cloud", "https://*.livekit.cloud"];
  if (raw) {
    const url = new URL(raw);
    const secure = url.protocol === "wss:" || url.protocol === "https:";
    sources.push(`${secure ? "wss" : "ws"}://${url.host}`, `${secure ? "https" : "http"}://${url.host}`);
  }
  return sources.join(" ");
}

const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; dev mode also needs eval for fast refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self' ${livekitSources()}${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only our own pages may use the camera, mic, and screen capture.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), display-capture=(self), geolocation=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
