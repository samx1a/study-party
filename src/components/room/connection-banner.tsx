"use client";

import { useConnectionState, useStartAudio } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useEffect, useState } from "react";

// Shows when the call is reconnecting (e.g. Wi-Fi blip) or when the browser
// blocked audio autoplay and needs one click to start sound.
export function ConnectionBanner() {
  const state = useConnectionState();
  const { mergedProps, canPlayAudio } = useStartAudio({ props: {} });
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (offline || state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
    return (
      <div role="status" className="bg-warn/15 px-4 py-2 text-center text-sm text-warn">
        {offline ? "You're offline. We'll reconnect when your internet is back…" : "Reconnecting…"}
      </div>
    );
  }
  if (!canPlayAudio) {
    return (
      <button
        onClick={mergedProps.onClick}
        className="w-full bg-accent/60 px-4 py-2 text-center text-sm text-accent-ink hover:bg-accent-hover"
      >
        Your browser paused room sound. Click here to turn it on.
      </button>
    );
  }
  return null;
}
