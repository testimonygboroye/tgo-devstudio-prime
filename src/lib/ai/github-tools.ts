import IntegrationConnection from "@/models/IntegrationConnection";
import { decryptCredentials } from "@/lib/integrations/crypto";

type GitHubCredentials = { token: string; allowedRepositories: string[]; defaultBranch: string };

function parseRepository(value: unknown) {
  const repo = String(value || "").trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error("Repository must be supplied as owner/repository.");
  return repo;
}

function parseBranch(value: unknown) {
  const branch = String(value || "").trim();
  if (!/^(?:ai|agents)\/[A-Za-z0-9._/-]{1,140}$/.test(branch) || branch.split("/").some(part => !part || part === "." || part === "..")) {
    throw new Error("AI code changes must use a new ai/ or agents/ branch; the default branch is protected.");
  }
  return branch;
}

function parsePath(value: unknown) {
  const path = String(value || "").trim().replace(/^\/+/, "");
  if (!path || path.length > 400 || path.split("/").some(part => !part || part === "." || part === "..")) throw new Error("A safe repository-relative file path is required.");
  return path;
}

async function credentials(repositoryValue: unknown) {
  const repository = parseRepository(repositoryValue);
  const row = await IntegrationConnection.findOne({ providerId: "github", status: "connected" }).select("+credentialsCiphertext").lean();
  if (!row?.credentialsCiphertext) throw new Error("Connect and verify GitHub in Admin → Integrations before granting GitHub tools.");
  const saved = decryptCredentials(row.credentialsCiphertext);
  const allowedRepositories = String(saved.allowedRepositories || "").split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
  if (!saved.token || !allowedRepositories.includes(repository)) throw new Error("This repository is not in the founder-approved GitHub allowlist.");
  return { repository, token: saved.token, allowedRepositories, defaultBranch: String(saved.defaultBranch || "main") } as GitHubCredentials & { repository: string };
}

async function githubRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: init.signal || AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String((payload as { message?: string }).message || "GitHub request failed.");
    throw new Error("GitHub API returned HTTP " + response.status + ": " + message.slice(0, 220));
  }
  return payload as T;
}

export async function readGitHubRepository(repositoryValue: unknown) {
  const config = await credentials(repositoryValue);
  const data = await githubRequest<Record<string, unknown>>(config.token, "/repos/" + config.repository);
  return { repository: config.repository, name: data.full_name, defaultBranch: data.default_branch, private: data.private, permissions: data.permissions };
}

export async function readGitHubFile(repositoryValue: unknown, pathValue: unknown, refValue?: unknown) {
  const config = await credentials(repositoryValue);
  const path = parsePath(pathValue);
  const ref = String(refValue || config.defaultBranch);
  const data = await githubRequest<{ name: string; path: string; sha: string; size: number; encoding: string; content: string; html_url: string }>(
    config.token,
    "/repos/" + config.repository + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(ref)
  );
  if (data.encoding !== "base64") throw new Error("GitHub returned an unsupported file encoding.");
  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  if (content.length > 100000) throw new Error("File is too large for a single AI read task; split the file or narrow the scope.");
  return { repository: config.repository, path: data.path, sha: data.sha, size: data.size, url: data.html_url, content };
}

export async function writeGitHubFile(input: { repository: unknown; path: unknown; branch: unknown; baseBranch?: unknown; content: string; message?: string }) {
  const config = await credentials(input.repository);
  const path = parsePath(input.path);
  const branch = parseBranch(input.branch);
  const baseBranch = String(input.baseBranch || config.defaultBranch);
  const branchRef = "/repos/" + config.repository + "/git/ref/heads/" + encodeURIComponent(branch);
  try {
    await githubRequest(config.token, branchRef);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("HTTP 404")) throw error;
    const base = await githubRequest<{ object: { sha: string } }>(config.token, "/repos/" + config.repository + "/git/ref/heads/" + encodeURIComponent(baseBranch));
    await githubRequest(config.token, "/repos/" + config.repository + "/git/refs", {
      method: "POST",
      body: JSON.stringify({ ref: "refs/heads/" + branch, sha: base.object.sha }),
    });
  }
  let sha: string | undefined;
  try {
    const existing = await githubRequest<{ sha: string }>(config.token, "/repos/" + config.repository + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(branch));
    sha = existing.sha;
  } catch (error) { if (!(error instanceof Error) || !error.message.includes("HTTP 404")) throw error; /* create a new file on the AI branch */ }
  const content = input.content;
  if (!content.trim() || content.length > 100000) throw new Error("Generated file content must contain 1–100,000 characters.");
  const result = await githubRequest<{ content?: { path?: string; sha?: string; html_url?: string }; commit?: { sha?: string; html_url?: string } }>(
    config.token,
    "/repos/" + config.repository + "/contents/" + path.split("/").map(encodeURIComponent).join("/"),
    {
      method: "PUT",
      body: JSON.stringify({
        message: String(input.message || "AI-assisted implementation: " + path).slice(0, 200),
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    }
  );
  return { repository: config.repository, branch, path: result.content?.path || path, fileSha: result.content?.sha, commitSha: result.commit?.sha, commitUrl: result.commit?.html_url, fileUrl: result.content?.html_url };
}

export async function createGitHubPullRequest(input: { repository: unknown; branch: unknown; baseBranch?: unknown; title: string; body: string }) {
  const config = await credentials(input.repository);
  const branch = parseBranch(input.branch);
  const base = String(input.baseBranch || config.defaultBranch);
  const result = await githubRequest<{ number: number; html_url: string; title: string; state: string }>(
    config.token,
    "/repos/" + config.repository + "/pulls",
    { method: "POST", body: JSON.stringify({ title: input.title.slice(0, 240), body: input.body.slice(0, 60000), head: branch, base, draft: true }) }
  );
  return { repository: config.repository, pullRequestNumber: result.number, url: result.html_url, title: result.title, state: result.state, draft: true };
}
