export interface GitHubCodeChangeResponse {
  summary: string;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
  content: string;
}

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:sk_live|sk_test|rk_live|rk_test)_[A-Za-z0-9]{12,}\b/i,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
];

export function parseGitHubCodeChangeResponse(raw: string): GitHubCodeChangeResponse {
  const source = String(raw || "").trim();
  if (!source || source.length > 160000) throw new Error("The AI code response is empty or too large to review safely.");
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  const json = fenced?.[1] || (firstBrace >= 0 && lastBrace > firstBrace ? source.slice(firstBrace, lastBrace + 1) : source);
  let parsed: Record<string, unknown>;
  try {
    const value = JSON.parse(json);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object.");
    parsed = value as Record<string, unknown>;
  } catch {
    throw new Error("The AI did not return the required structured code-change response. No repository write was made.");
  }
  const content = String(parsed.content || "");
  const summary = String(parsed.summary || "").trim();
  if (!content.trim() || content.length > 100000) throw new Error("Generated source must contain 1–100,000 characters.");
  if (!summary || summary.length > 1200) throw new Error("The AI code response must include a concise implementation summary.");
  if (SECRET_PATTERNS.some(pattern => pattern.test(content))) throw new Error("Generated code appears to contain a credential or private key. No repository write was made.");
  return {
    summary,
    content,
    commitMessage: String(parsed.commitMessage || "AI-assisted implementation").trim().slice(0, 200),
    pullRequestTitle: String(parsed.pullRequestTitle || "AI-assisted implementation").trim().slice(0, 240),
    pullRequestBody: String(parsed.pullRequestBody || summary).trim().slice(0, 10000),
  };
}
