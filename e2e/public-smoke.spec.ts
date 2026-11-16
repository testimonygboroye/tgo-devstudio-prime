import { test, expect } from "@playwright/test";

const adminLoginPath = process.env.TGO_ADMIN_LOGIN_PATH || "/command-deck/login";

const publicRoutes = [
  { path: "/", label: "Homepage" },
  { path: "/about", label: "About" },
  { path: "/services", label: "Services" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/contact", label: "Contact" },
  { path: "/faq", label: "FAQ" },
  { path: "/blog", label: "Blog" },
  { path: "/careers", label: "Careers" },
];

for (const route of publicRoutes) {
  test(`public page loads: ${route.label}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    expect(response, `${route.path} should return a document response`).not.toBeNull();
    expect(response!.status(), `${route.path} HTTP status`).toBeLessThan(400);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).toContainText(/\S/);

    expect(pageErrors, `${route.path} browser runtime errors`).toEqual([]);
  });
}

test("homepage exposes a usable primary navigation", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("header a:visible");
  await expect(links.first()).toBeVisible();
  expect(await links.count()).toBeGreaterThan(1);
});

const portalLoginRoutes = [
  { path: "/client/login", label: "Client" },
  { path: adminLoginPath, label: "Admin" },
];

for (const route of portalLoginRoutes) {
  test(`${route.label} portal login route is reachable`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    expect(response, `${route.path} should return a document response`).not.toBeNull();
    expect(response!.status(), `${route.path} HTTP status`).toBeLessThan(400);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).toContainText(/sign in|log in|login/i);
  });
}

test("workforce entry redirects unauthenticated visitors to workforce sign-in", async ({ page }) => {
  const response = await page.goto("/workforce", { waitUntil: "domcontentloaded" });

  expect(response, "/workforce should return a document response").not.toBeNull();
  expect(response!.status(), "/workforce HTTP status").toBeLessThan(400);
  const finalUrl = new URL(page.url());
  expect(finalUrl.pathname).toBe(adminLoginPath);
  expect(finalUrl.searchParams.get("redirect")).toBe("/workforce");
  await expect(page.locator("body")).toContainText(/workforce sign in/i);
});


test("homepage remains inside a narrow mobile viewport", async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(Math.max(dimensions.document, dimensions.body) - dimensions.viewport, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test("featured homepage media loads and stays inside its card", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const media = page.locator(".homepage-media-content").first();
  if (await media.count() === 0) test.skip(true, "No featured media is configured on this deployment.");
  await media.scrollIntoViewIfNeeded();
  await expect.poll(() => media.evaluate((element) => {
    if (element instanceof HTMLImageElement) return element.complete;
    if (element instanceof HTMLVideoElement) return element.readyState >= 1;
    return true;
  }), { timeout: 15000 }).toBe(true);
  const dimensions = await media.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const frame = element.closest(".homepage-media-frame")?.getBoundingClientRect();
    const loaded = element instanceof HTMLImageElement
      ? element.naturalWidth > 0
      : element instanceof HTMLVideoElement
        ? element.readyState >= 1
        : true;
    return { width: rect.width, frameWidth: frame?.width || 0, loaded };
  });
  expect(dimensions.loaded).toBe(true);
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.frameWidth - dimensions.width).toBeLessThanOrEqual(2);
});
