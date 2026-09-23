"use client";

import {
  createLocalScreenTracks,
  createLocalVideoTrack,
  type LocalTrack,
  type LocalVideoTrack,
  Room,
  ScreenSharePresets,
  type ScreenShareCaptureOptions,
  Track,
  VideoPresets,
} from "livekit-client";

// Study screens barely move, so 5 fps keeps text sharp at a fraction of the bandwidth.
export const SCREEN_CAPTURE: ScreenShareCaptureOptions = {
  audio: false,
  video: { displaySurface: "window" },
  resolution: { width: 1920, height: 1080, frameRate: 5 },
  contentHint: "text",
  selfBrowserSurface: "exclude",
  surfaceSwitching: "include",
};

export function createStudyRoom() {
  return new Room({
    // Viewers only download the quality that fits the tile they're looking at.
    adaptiveStream: true,
    // Senders stop encoding layers nobody is watching.
    dynacast: true,
    videoCaptureDefaults: { resolution: VideoPresets.h360.resolution },
    publishDefaults: {
      simulcast: true,
      videoEncoding: VideoPresets.h360.encoding,
      videoSimulcastLayers: [VideoPresets.h180],
      screenShareEncoding: { maxBitrate: 1_200_000, maxFramerate: 5 },
      screenShareSimulcastLayers: [ScreenSharePresets.h360fps3],
    },
  });
}

export async function createCameraTrack(): Promise<LocalVideoTrack> {
  return createLocalVideoTrack({ resolution: VideoPresets.h360.resolution, facingMode: "user" });
}

export async function createScreenTrack(): Promise<LocalTrack> {
  const tracks = await createLocalScreenTracks(SCREEN_CAPTURE);
  const video = tracks.find((t) => t.kind === Track.Kind.Video);
  // We asked for no audio, but stop anything extra just in case.
  tracks.filter((t) => t !== video).forEach((t) => t.stop());
  if (!video) throw new Error("No screen was shared.");
  return video;
}

export function canShareScreen() {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
}

// Turns a getUserMedia/getDisplayMedia error into advice a person can act on.
export function describeMediaError(err: unknown, what: "camera" | "screen"): string | null {
  const name = err instanceof Error ? err.name : "";
  if (what === "screen" && name === "NotAllowedError") {
    // Also thrown when the user just closes the picker. On macOS it can mean
    // the browser lacks Screen Recording permission in System Settings.
    return "Screen sharing was cancelled or blocked. Pick a window to share. On a Mac, you may need to allow your browser in System Settings → Privacy & Security → Screen Recording.";
  }
  if (name === "NotAllowedError") {
    return "Camera access is blocked. Click the camera icon in your address bar, allow it, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera found. Plug one in or check that no other app is using it.";
  }
  if (name === "NotReadableError") {
    return "Your camera is busy in another app (Zoom, FaceTime…). Close it and try again.";
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}
