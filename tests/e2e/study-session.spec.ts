import { type Browser, expect, type Page, test } from "@playwright/test";

const run = Date.now().toString(36);

async function newUser(browser: Browser, name: string, next = "/dashboard") {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/sign-up?next=${encodeURIComponent(next)}`);
  await page.fill("#name", name);
  await page.fill("#email", `${name.toLowerCase()}-${run}@e2e.test`);
  await page.fill("#password", "password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(`**${next}`);
  return page;
}

async function joinWithCameraAndScreen(page: Page) {
  await expect(page.getByTestId("join")).toBeDisabled();
  await page.getByTestId("start-camera").click();
  await page.getByTestId("pick-screen").click();
  await page.getByTestId("join").click();
  await expect(page.getByTestId("timer")).toBeVisible();
}

test("two friends run a full study session", async ({ browser }) => {
  // Host signs up and creates a room.
  const host = await newUser(browser, "Hana");
  await host.getByLabel("Room name").fill("E2E study hall");
  await host.getByRole("button", { name: "Create room" }).click();
  await host.waitForURL("**/r/*");
  const roomPath = new URL(host.url()).pathname;
  await joinWithCameraAndScreen(host);

  // Guest opens the invite link, signs up, and lands back in the room.
  const guest = await newUser(browser, "Gabe", roomPath);
  await joinWithCameraAndScreen(guest);

  await expect(host.getByTestId("tile")).toHaveCount(2);
  await expect(guest.getByTestId("tile")).toHaveCount(2);

  // Timer: host starts focus, guest sees it and their mic is locked.
  await host.getByTestId("timer-start").click();
  await expect(guest.getByTestId("timer")).toHaveAttribute("data-phase", "focus");
  await expect(guest.getByTestId("mic")).toBeDisabled();

  // Goals: guest adds a goal and checks it off; host sees both.
  await guest.getByTestId("goal-input").fill("Finish lab 3");
  await guest.getByTestId("goal-input").press("Enter");
  await expect(host.getByTestId("goals")).toContainText("Finish lab 3");
  await guest.getByRole("button", { name: "Mark done" }).click();
  await expect(host.getByTestId("goals")).toContainText("✓ Finish lab 3");

  // Privacy: guest hides their screen; host sees the placeholder.
  await guest.getByTestId("hide-screen").click();
  await expect(host.getByText("Screen hidden for a moment")).toBeVisible();
  await guest.getByTestId("show-screen").click();
  await expect(host.getByText("Screen hidden for a moment")).toBeHidden();

  // Skip to break: mics unlock.
  await guest.getByTestId("timer-skip").click();
  await expect(host.getByTestId("timer")).toHaveAttribute("data-phase", "break");
  await expect(host.getByTestId("mic")).toBeEnabled();

  // Host removes the guest, who can't come back.
  host.once("dialog", (d) => d.accept());
  await host.locator('[data-testid="tile"][data-name="Gabe"]').hover();
  await host.locator('[data-testid="tile"][data-name="Gabe"]').getByRole("button", { name: "Remove" }).click();
  await expect(guest.getByText("You were removed")).toBeVisible();
  await guest.goto(roomPath);
  await expect(guest.getByText("You can't join this room")).toBeVisible();
});

test("signed-out visitors are sent to sign in and back", async ({ page }) => {
  await page.goto("/r/doesnotexist");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fr%2Fdoesnotexist/);
});
