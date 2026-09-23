import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy" updated="September 23, 2026">
      <p>
        Study Party is a place to study with friends, camera and screen on. That means privacy matters a lot.
        Here is exactly what we collect and what we don&apos;t, in plain words.
      </p>

      <h2>Video, audio, and screens</h2>
      <ul>
        <li>
          <strong>Nothing is recorded.</strong> Your camera, mic, and screen go through our video provider
          (LiveKit) to the other people in your room, live, and are never saved.
        </li>
        <li>Only people in the same room can see your video and screen.</li>
        <li>
          You choose what to share. We recommend sharing a single window, not your whole screen. You can hide
          your screen for 30 seconds at any time.
        </li>
      </ul>

      <h2>What we store</h2>
      <ul>
        <li>Your name and time zone. You can use Study Party as a guest with just a name.</li>
        <li>If you create an account: your email and a securely hashed password.</li>
        <li>Rooms you create or join, and the goals you write in them.</li>
        <li>How many minutes you studied each day, to show your hours and streaks.</li>
        <li>Sign-in sessions (a cookie), including the IP address and browser used to sign in.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your data or show ads.</li>
        <li>We don&apos;t use third-party tracking or analytics cookies.</li>
      </ul>

      <h2>Who else handles data</h2>
      <ul>
        <li>LiveKit (live video delivery), our hosting provider, and our database provider.</li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        You can delete your account from Settings at any time. That removes your account, rooms you host, your
        goals, and your study history.
      </p>
    </ProsePage>
  );
}
