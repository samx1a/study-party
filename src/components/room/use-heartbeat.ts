"use client";

import { useEffect } from "react";

const EVERY_MS = 60_000;

// Tells the server we're still here about once a minute. The server decides
// whether the minute counts (screen shared, not on break, not a duplicate).
export function useHeartbeat(roomId: string) {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const send = () =>
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId, timezone }),
        keepalive: true,
      }).catch(() => {});
    send();
    const t = setInterval(send, EVERY_MS);
    return () => clearInterval(t);
  }, [roomId]);
}
