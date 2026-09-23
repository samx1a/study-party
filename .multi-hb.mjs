import { chromium } from "@playwright/test";
const out = process.env.OUT, room = process.env.ROOM;
const users = (process.env.USERS || "a,b,c").split(",");
const b = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--auto-select-desktop-capture-source=Entire screen"],
});
const pages = [];
for (const u of users) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, permissions: ["camera", "microphone", "clipboard-read", "clipboard-write"] });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && console.log(u, "console:", m.text()));
  p.on("pageerror", (e) => console.log(u, "pageerror:", e.message));
  await p.goto(`http://localhost:3100/sign-in?next=/r/${room}`);
  await p.fill("#email", `${u}@test.dev`); await p.fill("#password", "password123");
  await p.click("button[type=submit]");
  await p.waitForURL(`**/r/${room}`);
  await p.click("[data-testid=start-camera]");
  await p.click("[data-testid=pick-screen]");
  await p.click("[data-testid=join]:not([disabled])");
  pages.push(p);
}
await pages[0].waitForTimeout(3000);
globalThis.pages = pages;
const steps = process.env.STEPS ? (await import(process.env.STEPS)).default : async () => {};
await steps(pages, out);
await pages[0].screenshot({ path: `${out}/room-a.png` });
await b.close();
