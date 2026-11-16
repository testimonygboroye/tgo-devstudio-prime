import { resolveWhatsAppAiDisposition } from "../whatsappAiPolicy";

describe("WhatsApp AI conversation execution policy", () => {
  it("queues approval-gated AI replies for founder review", () => {
    expect(resolveWhatsAppAiDisposition(true, 1200, 100000)).toBe("approval_required");
  });
  it("allows only explicitly approval-free agents to execute directly below budget", () => {
    expect(resolveWhatsAppAiDisposition(false, 1200, 100000)).toBe("execute");
  });
  it("blocks execution when the daily token budget is exhausted", () => {
    expect(resolveWhatsAppAiDisposition(false, 100000, 100000)).toBe("budget_exhausted");
    expect(resolveWhatsAppAiDisposition(true, 100001, 100000)).toBe("budget_exhausted");
  });
  it("treats a zero or invalid budget as exhausted", () => {
    expect(resolveWhatsAppAiDisposition(false, 0, 0)).toBe("budget_exhausted");
    expect(resolveWhatsAppAiDisposition(false, 0, Number.NaN)).toBe("budget_exhausted");
  });
});
