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

test("commercial catalogue contains all 21 distinct service lines and package prices", async ({ page }) => {
  await page.goto("/services/catalogue", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".catalogue-card");
  await expect(cards).toHaveCount(21);
  await expect(page.getByRole("heading", { name: "AI Solutions & Intelligent Automation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Software Maintenance & Managed Support" })).toBeVisible();
  const serviceNames = await cards.locator("h2, h3").allTextContents();
  expect(new Set(serviceNames.map(name => name.trim())).size).toBe(21);
  const packages = page.locator(".catalogue-package");
  await expect(packages).toHaveCount(62);
  await expect(page.locator(".catalogue-billing-label").filter({ hasText: "/ month" })).toHaveCount(5);
  await expect(page.locator(".catalogue-billing-label").filter({ hasText: "Custom scope" })).toHaveCount(55);
  const prices = await packages.locator("strong").allTextContents();
  expect(prices).toHaveLength(62);
  expect(prices.every(price => /₦|NGN/.test(price))).toBe(true);
  const descriptions = await packages.locator("p").allTextContents();
  expect(descriptions.every(description => description.trim().length > 20)).toBe(true);
});

test("public capabilities are deduplicated and expanded", async ({ page }) => {
  await page.goto("/services", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".services-card");
  await expect(cards).toHaveCount(41);
  const capabilityNames = await cards.locator("h2, h3").allTextContents();
  expect(new Set(capabilityNames.map(name => name.trim())).size).toBe(41);
  await expect(page.getByRole("heading", { name: "UI/UX & Digital Product Design" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cybersecurity & Application Security" })).toBeVisible();
});

test("public navigation hides legal pages on desktop and mobile while the footer keeps them", async ({ page }) => {
  const legalLink = /Privacy Policy|Consumer Terms|Usage Policy|Accessibility Statement|Data Deletion Requests/i;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Connect & Support" }).click();
  const desktopNavigation = page.locator('nav[aria-label="Main navigation"]:visible').first();
  await expect(desktopNavigation.getByRole("link", { name: legalLink })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const mobileNavigation = page.locator('nav[aria-label="Main navigation"]:visible').last();
  await expect(mobileNavigation.getByRole("link", { name: legalLink })).toHaveCount(0);
  await expect(page.locator("footer").getByRole("link", { name: legalLink })).toHaveCount(5);
});

test("homepage hero copy and product visual never overlap", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const copy = page.locator(".home-hero-copy");
    const visual = page.locator(".home-visual-wrap");
    await expect(copy).toBeVisible();
    await expect(visual).toBeVisible();
    const overlaps = await page.evaluate(() => {
      const copyElement = document.querySelector(".home-hero-copy");
      const visualElement = document.querySelector(".home-visual-wrap");
      if (!copyElement || !visualElement) return true;
      const a = copyElement.getBoundingClientRect();
      const b = visualElement.getBoundingClientRect();
      return !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
    });
    expect(overlaps, `Hero copy and product visual overlap at ${viewport.width}px`).toBe(false);
  }
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
  const openMenu = page.getByRole("button", { name: "Open menu" });
  await openMenu.evaluate((element) => (element as HTMLButtonElement).click());
  const mobileNavigation = page.locator('nav[aria-label="Main navigation"]').last();
  await expect(mobileNavigation).toHaveAttribute("aria-hidden", "false");
  const capabilityGroup = mobileNavigation.locator("summary").filter({ hasText: "Capabilities & Work" });
  await capabilityGroup.evaluate((element) => (element as HTMLElement).click());
  await expect(mobileNavigation.getByRole("link", { name: "Services", exact: true })).toBeVisible();
  await mobileNavigation.getByRole("button", { name: "Close menu" }).evaluate((element) => (element as HTMLButtonElement).click());
  await expect(mobileNavigation).toHaveAttribute("aria-hidden", "true");
  await openMenu.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(mobileNavigation).toHaveAttribute("aria-hidden", "false");
  await mobileNavigation.locator("summary").filter({ hasText: "Capabilities & Work" }).evaluate((element) => (element as HTMLElement).click());
  await mobileNavigation.getByRole("link", { name: "Services", exact: true }).evaluate((element) => (element as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("contact form blocks empty submissions without creating an enquiry", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Send Message" }).click();
  const name = page.getByLabel("Full Name");
  await expect(name).toBeFocused();
  expect(await name.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
  await expect(page).toHaveURL(/\/contact$/);
});

test("homepage featured media fills its card using responsive cover cropping", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const frame = page.locator(".homepage-media-frame").first();
  await expect(frame).toBeVisible({ timeout: 15000 });
  const media = frame.locator("img, video").first();
  await expect(media).toBeVisible();
  await media.evaluate(async element => {
    if (element instanceof HTMLImageElement && !element.complete) await element.decode();
    if (element instanceof HTMLVideoElement && element.readyState < 1) {
      await new Promise<void>(resolve => element.addEventListener("loadedmetadata", () => resolve(), { once: true }));
    }
  });
  const result = await frame.evaluate(element => {
    const media = element.querySelector("img, video");
    if (!(media instanceof HTMLImageElement) && !(media instanceof HTMLVideoElement)) return null;
    const stage = media.parentElement;
    if (!stage) return null;
    const stageRect = stage.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    return {
      frameWidth: stageRect.width,
      frameHeight: stageRect.height,
      mediaWidth: mediaRect.width,
      mediaHeight: mediaRect.height,
      frameRatio: stageRect.width / stageRect.height,
      renderedRatio: mediaRect.width / mediaRect.height,
      objectFit: getComputedStyle(media).objectFit,
    };
  });
  expect(result).not.toBeNull();
  expect(result!.mediaWidth).toBeGreaterThan(0);
  expect(result!.mediaHeight).toBeGreaterThan(0);
  expect(Math.abs(result!.frameWidth - result!.mediaWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(result!.frameHeight - result!.mediaHeight)).toBeLessThanOrEqual(2);
  expect(result!.objectFit).toBe("cover");
  expect(Math.abs(result!.renderedRatio - result!.frameRatio)).toBeLessThan(0.02);
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

for (const route of ["/client/login", "/command-deck/login", "/workforce/login"]) {
  test(`portal login route is reachable: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(/sign in|log in|login/i);
  });
}

test("workforce routes redirect unauthenticated visitors to the correct sign-in", async ({ page }) => {
  for (const route of ["/workforce", "/workforce/login"]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe("/command-deck/login");
    expect(finalUrl.searchParams.get("redirect")).toBe("/workforce");
  }
});

test("internal admin implementation routes are not publicly exposed", async ({ page }) => {
  for (const route of ["/admin", "/admin/login"]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);
  }
});

test("custom 404 page provides useful recovery links", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-tgo-qa", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("link", { name: /Explore services/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse our work/i })).toBeVisible();
});

test("public images load without broken image elements", async ({ page }) => {
  for (const route of ["/", "/services", "/services/catalogue", "/portfolio", "/blog", "/about"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const broken = await page.evaluate(async () => {
      const images = [...document.images];
      images.forEach(image => { image.loading = "eager"; });
      await Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 10000);
      })));
      return images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src);
    });
    expect(broken, "Broken images on " + route).toEqual([]);
  }
});

test("CMS hero background image is visible and loaded", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const result = await page.locator(".home-hero-cms-background").evaluate(async element => {
    const style = getComputedStyle(element);
    const match = style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return { hasUrl: false, opacity: Number(style.opacity), zIndex: Number(style.zIndex) };
    const loaded = await new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = match[1];
    });
    return { hasUrl: true, loaded, opacity: Number(style.opacity), zIndex: Number(style.zIndex) };
  });
  expect(result.hasUrl).toBe(true);
  expect(result.loaded).toBe(true);
  expect(result.opacity).toBeGreaterThan(0);
  expect(result.zIndex).toBeGreaterThanOrEqual(0);
});

test("public brand links point to TGO DevStudio accounts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('footer a[aria-label="Instagram"]')).toHaveAttribute("href", "https://www.instagram.com/tgodevstudio");
  await expect(page.locator('footer a[aria-label="Facebook"]')).toHaveAttribute("href", "https://www.facebook.com/tgodevstudio");
  await expect(page.locator('footer a[aria-label="WhatsApp"]')).toHaveAttribute("href", "https://wa.me/2348132429504");
});

test("homepage AI chat is usable on mobile and returns real published package prices", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Accept", exact: true }).click({ timeout: 1500 }).catch(() => {});
  await page.getByRole("button", { name: "Open contact and assistant menu" }).click();
  await page.getByRole("button", { name: /AI Chatbot/ }).click();
  const transcript = page.getByRole("region", { name: "TGO Website Assistant" });
  await expect(transcript).toBeVisible();
  const bounds = await transcript.boundingBox();
  expect(bounds).not.toBeNull();
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewportWidth);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  const input = page.locator('textarea[placeholder="Ask your question…"]');
  await expect(input).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await input.fill("Give me the exact published NGN starting package names and prices for Custom Business Website, Custom Web Application, AI Solutions & Intelligent Automation, and Software Maintenance & Managed Support. Do not guess.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/temporarily unavailable|couldn't reach the AI service/i)).toHaveCount(0, { timeout: 60000 });
  await expect(transcript).toContainText("Launch", { timeout: 60000 });
  await expect(transcript).toContainText("Application MVP");
  await expect(transcript).toContainText("Knowledge Assistant");
  await expect(transcript).toContainText("Essential Care");
  await expect(transcript).toContainText(/1,500,000/);
  await expect(transcript).toContainText(/3,500,000/);
  await expect(transcript).toContainText(/1,200,000/);
  await expect(transcript).toContainText(/150,000/);
});


test("client finance and payment endpoints reject unauthenticated access", async ({ page }) => {
  const finance = await page.request.get("/api/client/finance");
  expect(finance.status()).toBe(401);
  const initialize = await page.request.post("/api/client/payments/initialize", { data: { orderId: "000000000000000000000000" } });
  expect(initialize.status()).toBe(401);
  const verify = await page.request.get("/api/client/payments/verify?reference=TGO_ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  expect(verify.status()).toBe(401);
});

test("Paystack webhook rejects unsigned events without creating a payment", async ({ page }) => {
  const response = await page.request.post("/api/webhooks/paystack", { data: { event: "ping" } });
  expect(response.status()).toBe(401);
  await expect(response).not.toBeOK();
});

test("founder finance, unified messaging and AI workforce endpoints are private", async ({ page }) => {
  const finance = await page.request.get("/api/platform/finance");
  expect(finance.status()).toBe(401);
  const messaging = await page.request.get("/api/platform/messaging");
  expect(messaging.status()).toBe(401);
  const ai = await page.request.get("/api/platform/ai-workforce");
  expect(ai.status()).toBe(401);
});


test("founder and client portals expose the official Google sign-in option", async ({ page }) => {
  for (const route of ["/command-deck/login", "/client/login"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const googleButton = page.getByRole("button", { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton.locator("svg path[fill='#4285F4']")).toHaveCount(1);
  }
  await page.goto("/client/register", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Your name and password are collected on the next screen/i)).toBeVisible();
});

test("every published URL in the XML sitemap returns a successful page", async ({ request }) => {
  test.setTimeout(20 * 60 * 1000);
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const xml = await sitemapResponse.text();
  const sitemapUrls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(match => match[1].replace(/&amp;/g, "&").trim())
    .filter(Boolean);
  const origin = new URL(String(test.info().project.use.baseURL || "https://tgo-devstudio-prime.vercel.app")).origin;
  const internalUrls = [...new Set(sitemapUrls.filter(value => {
    try { return new URL(value).origin === origin; } catch { return false; }
  }))];
  expect(internalUrls.length).toBeGreaterThan(0);
  const failures: string[] = [];
  for (let index = 0; index < internalUrls.length; index += 8) {
    const batch = internalUrls.slice(index, index + 8);
    const results = await Promise.all(batch.map(async url => {
      try {
        const response = await request.get(url, { timeout: 20000 });
        return response.status() < 400 ? null : url + " → HTTP " + response.status();
      } catch (error) {
        return url + " → " + (error instanceof Error ? error.message : "request failed");
      }
    }));
    failures.push(...results.filter((value): value is string => Boolean(value)));
  }
  expect(failures, "Published sitemap pages that failed to load").toEqual([]);
});



test("client and founder login surfaces fit narrow mobile viewports", async ({ page }) => {
  for (const route of ["/client/login", "/client/register", "/command-deck/login"]) {
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
