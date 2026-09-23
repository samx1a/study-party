import { ImageResponse } from "next/og";

export const alt = "Study Party: study together, cameras on";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview card shown when someone pastes a Study Party link into chat.
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#f6f4fb",
        color: "#221f33",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 600 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#bcc5ff" }} />
        Study Party
      </div>
      <div style={{ marginTop: 48, fontSize: 96, lineHeight: 1.05, fontWeight: 700 }}>Study together.</div>
      <div style={{ fontSize: 96, lineHeight: 1.05, fontWeight: 700, color: "#29237d" }}>Cameras on.</div>
      <div style={{ marginTop: 32, fontSize: 32, color: "#6b6780" }}>
        Shared focus timer · Quiet during focus · Streaks
      </div>
    </div>,
    size,
  );
}
