import { expect, test } from "@playwright/test";

import { resetData } from "./support";

test.beforeAll(resetData);

for (const width of [320, 390, 768]) {
  test(`core screens fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/applications?view=table");
    const application = await page.locator('table tbody a[href^="/applications/"]').first().getAttribute("href");
    expect(application).toBeTruthy();
    for (const route of ["/", "/applications?view=table", "/applications?view=board", "/profile", "/new", "/resume", "/settings", "/settings?section=scoring", "/jobs", "/inbox", "/usage", "/agent", "/startups", "/profile?section=experience", ...["resume", "letter", "posting", "email", "notes", "conversation"].map((tab) => `${application}?tab=${tab}`)]) {
      await page.goto(route);
      await expect(page.locator("#main")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), { message: route }).toBeLessThanOrEqual(1);
    }
  });
}

test("phone navigation traps focus, closes on navigation and preserves desktop collapse", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  await expect(drawer).toBeVisible();
  const close = drawer.getByRole("button", { name: "Close navigation" });
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(drawer.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await drawer.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(drawer).toBeHidden();
  await open.click();
  await page.setViewportSize({ width: 1400, height: 900 });
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("PWA assets are public and offline navigation reveals no cached personal data", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    for (const path of ["/manifest.webmanifest", "/sw.js", "/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"]) {
      const response = await context.request.get(path);
      expect(response.status(), path).toBe(200);
      expect(new URL(response.url()).pathname, path).toBe(path);
    }
    await page.goto("/login");
    const manifest = await (await context.request.get("/manifest.webmanifest")).json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    expect(await page.evaluate(async () => {
      const cache = await caches.open("dossier-offline-v1");
      return (await cache.keys()).map((request) => new URL(request.url).pathname);
    })).toEqual(["/offline.html"]);
    await context.setOffline(false);
    await page.getByRole("link", { name: "Try again" }).click();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});
