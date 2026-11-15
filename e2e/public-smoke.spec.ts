import { test, expect } from "@playwright/test";

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
    await expect(page.locator("body")).toContainText(/\\S/);

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
  { path: "/admin/login", label: "Admin" },
  { path: "/workforce/login", label: "Workforce" },
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
