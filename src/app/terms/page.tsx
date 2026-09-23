import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms" updated="September 23, 2026">
      <p>By using Study Party you agree to these simple rules.</p>
      <h2>Be decent</h2>
      <ul>
        <li>Only share things on your screen that everyone in the room is OK seeing.</li>
        <li>
          No harassment, hate, sexual content, or anything illegal. Hosts can remove people, and we can close
          accounts.
        </li>
        <li>Don&apos;t record or screenshot other people without their permission.</li>
      </ul>
      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old.</li>
        <li>Keep your password safe. You&apos;re responsible for activity on your account.</li>
      </ul>
      <h2>The service</h2>
      <p>
        Study Party is provided as-is, without warranties. We may change or pause features. We&apos;ll try to
        give notice of big changes.
      </p>
    </ProsePage>
  );
}
