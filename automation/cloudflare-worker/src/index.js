const JOBS = [
  "/api/cron/webhook-delivery",
  "/api/cron/sales-followups",
  "/api/cron/executive-reports",
  "/api/cron/marketing-campaigns",
  "/api/cron/support-escalation",
  "/api/cron/engagement-expiry",
  "/api/cron/analytics-snapshot"
];

async function runJobs(env) {
  const base = String(env.APP_BASE_URL || "").replace(/\/$/, "");
  if (!base || !env.PLATFORM_AUTOMATION_CRON_SECRET) {
    throw new Error("Set APP_BASE_URL and PLATFORM_AUTOMATION_CRON_SECRET as Worker variables/secrets.");
  }
  const results = await Promise.all(JOBS.map(async (path) => {
    try {
      const response = await fetch(base + path, {
        method: "GET",
        headers: { Authorization: "Bearer " + env.PLATFORM_AUTOMATION_CRON_SECRET, "User-Agent": "TGO-Portable-Automation/1.0" },
        redirect: "manual"
      });
      const detail = (await response.text()).slice(0, 1200);
      return { path, status: response.status, ok: response.ok, detail };
    } catch (error) {
      return { path, ok: false, status: 0, detail: error instanceof Error ? error.message : "Request failed" };
    }
  }));
  return { ok: results.every((item) => item.ok), checkedAt: new Date().toISOString(), results };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runJobs(env).then((result) => console.log(JSON.stringify(result))).catch((error) => console.error(error)));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "TGO portable automation", schedule: "every 15 minutes" });
    if (url.pathname === "/run" && request.method === "POST") {
      if (!env.MANUAL_TRIGGER_SECRET || request.headers.get("authorization") !== "Bearer " + env.MANUAL_TRIGGER_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try { const result = await runJobs(env); return Response.json(result, { status: result.ok ? 200 : 502 }); }
      catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Automation failed" }, { status: 503 }); }
    }
    return new Response("Not found", { status: 404 });
  }
};
