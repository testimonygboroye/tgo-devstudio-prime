import { parseGitHubCodeChangeResponse } from "../github-code-change";

describe("parseGitHubCodeChangeResponse", () => {
  const valid = {
    summary: "Adds the requested accessible component.",
    commitMessage: "Add accessible component",
    pullRequestTitle: "Add accessible component",
    pullRequestBody: "## Summary\nAdds the component.\n\n## Test plan\n- Run tests.",
    content: "export default function Example(){ return <main>Ready</main>; }",
  };

  it("parses a structured response wrapped in a JSON code fence", () => {
    const result = parseGitHubCodeChangeResponse("```json\n" + JSON.stringify(valid) + "\n```");
    expect(result.content).toBe(valid.content);
    expect(result.summary).toContain("accessible component");
    expect(result.pullRequestTitle).toBe(valid.pullRequestTitle);
  });

  it("rejects unstructured output before any repository write", () => {
    expect(() => parseGitHubCodeChangeResponse("Here is some code without the required JSON.")).toThrow(/structured code-change response/i);
  });

  it("rejects missing or oversized source content", () => {
    expect(() => parseGitHubCodeChangeResponse(JSON.stringify({ ...valid, content: "" }))).toThrow(/source must contain/i);
    expect(() => parseGitHubCodeChangeResponse(JSON.stringify({ ...valid, content: "x".repeat(100001) }))).toThrow(/source must contain/i);
  });

  it("rejects private keys and provider credentials", () => {
    expect(() => parseGitHubCodeChangeResponse(JSON.stringify({ ...valid, content: "const key = \"sk_live_12345678901234567890\";" }))).toThrow(/credential or private key/i);
    expect(() => parseGitHubCodeChangeResponse(JSON.stringify({ ...valid, content: "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----" }))).toThrow(/credential or private key/i);
  });
});
