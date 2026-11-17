import { test, expect } from "@playwright/test";

const adminLoginPath = process.env.TGO_ADMIN_LOGIN_PATH || "/command-deck/login";

const publicRoutes = [
  { path: "/", label: "Homepage" },
  { path: "/about", label: "About" },
  { path: "/services", label: "Services" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/contact", label: "Contact" },
  { path: "/faq", label: "FAQ" },
  { path: "/process", label: "Process" },
  { path: "/stack", label: "Technology stack" },
  { path: "/industries", label: "Industries" },
  { path: "/engagement-models", label: "Engagement models" },
  { path: "/testimonials", label: "Testimonials" },
  { path: "/blog", label: "Blog" },
  { path: "/blog/what-is-uptime-and-why-should-you-care", label: "Blog article detail" },
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

    const knownHydrationBaseline = route.path === "/"
      ? pageErrors.filter(message => message.includes("Minified React error #418"))
      : [];
    const unexpectedErrors = pageErrors.filter(message => !knownHydrationBaseline.includes(message));
    expect(unexpectedErrors, `${route.path} unexpected browser runtime errors`).toEqual([]);
    if (knownHydrationBaseline.length) {
      test.info().annotations.push({
        type: "known-baseline",
        description: "React hydration error #418 is being fixed in the homepage countdown component in PR #42; remove this temporary allowance after that release is live.",
      });
    }
  });
}

test("known illustrated blog article uses its own social preview image", async ({ page }) => {
  await page.goto("/blog/what-is-uptime-and-why-should-you-care", { waitUntil: "domcontentloaded" });
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toMatch(/^https:\/\/res\.cloudinary\.com\//);
});

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
  const frameCount = await page.locator(".homepage-media-frame").count();
  if (frameCount === 0) test.skip(true, "No featured media is configured on this deployment.");

  await page.evaluate(() => document.querySelector(".homepage-media-frame")?.scrollIntoView({ block: "center" }));
  await page.waitForFunction(() => {
    const element = document.querySelector(".homepage-media-frame .homepage-media-content");
    if (!element) return false;
    if (element instanceof HTMLImageElement) return element.complete && element.naturalWidth > 0;
    if (element instanceof HTMLVideoElement) return element.readyState >= 1;
    return true;
  }, undefined, { timeout: 15000 });

  const dimensions = await page.evaluate(() => {
    const frame = document.querySelector(".homepage-media-frame");
    const element = frame?.querySelector(".homepage-media-content");
    if (!frame || !element) return null;
    const mediaRect = element.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const loaded = element instanceof HTMLImageElement
      ? element.complete && element.naturalWidth > 0
      : element instanceof HTMLVideoElement
        ? element.readyState >= 1
        : true;
    return { width: mediaRect.width, frameWidth: frameRect.width, loaded };
  });

  if (!dimensions) throw new Error("Featured media disappeared before it could be checked.");
  expect(dimensions.loaded).toBe(true);
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.frameWidth - dimensions.width).toBeLessThanOrEqual(2);
});

test("mobile navigation drawer opens, exposes links, and closes after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const openMenu = page.getByRole("button", { name: "Open menu" });
  await expect(openMenu).toBeVisible();
  await openMenu.click();

  const drawer = page.locator('nav[aria-label="Main navigation"]').last();
  await expect(drawer).toBeVisible();
  await drawer.getByText("Capabilities & Work", { exact: true }).click();
  await expect(drawer.getByRole("link", { name: "Services" })).toBeVisible();

  await drawer.getByRole("button", { name: "Close menu" }).click();
  await expect(drawer).toHaveAttribute("aria-hidden", "true");

  await openMenu.click();
  await drawer.getByText("Capabilities & Work", { exact: true }).click();
  await drawer.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(url => new URL(url).pathname === "/services");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
});

test("custom 404 page provides working recovery navigation", async ({ page }) => {
  const response = await page.goto("/this-route-should-not-exist-e2e", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("link", { name: /explore services/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse our work/i })).toBeVisible();
});
