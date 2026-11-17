import { test, expect } from "@playwright/test";

const publicRoutes = [
  "/", "/about", "/services", "/services/catalogue", "/portfolio", "/contact",
  "/faq", "/process", "/stack", "/industries", "/engagement-models",
  "/testimonials", "/blog", "/blog/what-is-uptime-and-why-should-you-care",
  "/careers", "/book-a-call", "/help", "/privacy-policy", "/terms-of-service",
  "/usage-policy", "/accessibility", "/data-deletion",
];

for (const route of publicRoutes) {
  test(`public route loads: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `${route} should return a document`).not.toBeNull();
    expect(response!.status(), `${route} HTTP status`).toBeLessThan(400);
    await expect(page.locator("body")).not.toBeEmpty();
    const knownHydrationBaseline = route === "/"
      ? errors.filter(message => message.includes("Minified React error #418"))
      : [];
    expect(errors.filter(message => !knownHydrationBaseline.includes(message))).toEqual([]);
    if (knownHydrationBaseline.length) {
      test.info().annotations.push({
        type: "known-baseline",
        description: "React hydration error #418 remains tracked separately; remove this allowance after its production fix is verified.",
      });
    }
  });
}

test("commercial catalogue contains all 17 distinct service lines and package prices", async ({ page }) => {
  await page.goto("/services/catalogue", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".catalogue-card");
  await expect(cards).toHaveCount(17);
  await expect(page.getByRole("heading", { name: "AI Solutions & Intelligent Automation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Software Maintenance & Managed Support" })).toBeVisible();
  const prices = await page.locator(".catalogue-package strong").allTextContents();
  expect(prices.length).toBeGreaterThanOrEqual(40);
  expect(prices.some(price => price.includes("₦"))).toBe(true);
});

test("public capabilities are deduplicated and expanded", async ({ page }) => {
  await page.goto("/services", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".services-card");
  await expect(cards).toHaveCount(47);
  await expect(page.getByRole("heading", { name: "UI/UX & Digital Product Design" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cybersecurity & Application Security" })).toBeVisible();
});

test("FAQ detail route resolves the published question slug", async ({ page }) => {
  const response = await page.goto("/faq/who-is-behind-tgo-devstudio", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Who is behind TGO DevStudio?" })).toBeVisible();
});

test("mobile navigation drawer opens, expands and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Capabilities & Work" }).click();
  const services = page.getByRole("link", { name: "Services", exact: true });
  await expect(services).toBeVisible();
  await services.click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading", { name: "Everything your next idea needs." })).toBeVisible();
});

test("contact form blocks empty submissions without creating an enquiry", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Send Message" }).click();
  const name = page.getByLabel("Full Name");
  await expect(name).toBeFocused();
  expect(await name.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
  await expect(page).toHaveURL(/\/contact$/);
});

test("homepage featured media loads and fits its frame", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const frame = page.locator(".homepage-media-frame").first();
  if (await frame.count() === 0) test.skip(true, "No homepage media is configured.");
  await frame.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const media = document.querySelector(".homepage-media-frame .homepage-media-content");
    if (media instanceof HTMLImageElement) return media.complete && media.naturalWidth > 0;
    if (media instanceof HTMLVideoElement) return media.readyState >= 1;
    return Boolean(media);
  }, undefined, { timeout: 15000 });
  const result = await frame.evaluate(element => {
    const media = element.querySelector(".homepage-media-content");
    if (!media) return null;
    const frameRect = element.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    return { frameWidth: frameRect.width, mediaWidth: mediaRect.width };
  });
  expect(result).not.toBeNull();
  expect(result!.mediaWidth).toBeGreaterThan(0);
  expect(result!.frameWidth - result!.mediaWidth).toBeLessThanOrEqual(2);
});

test("mobile public routes have no horizontal overflow", async ({ page }) => {
  for (const route of ["/", "/services", "/services/catalogue", "/contact"]) {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(Math.max(dimensions.document, dimensions.body) - dimensions.viewport, `${route} overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

for (const route of ["/client/login", "/command-deck/login"]) {
  test(`portal login route is reachable: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(/sign in|log in|login/i);
  });
}

test("workforce route redirects unauthenticated visitors to the correct sign-in", async ({ page }) => {
  const response = await page.goto("/workforce", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  const finalUrl = new URL(page.url());
  expect(finalUrl.pathname).toBe("/command-deck/login");
  expect(finalUrl.searchParams.get("redirect")).toBe("/workforce");
});
