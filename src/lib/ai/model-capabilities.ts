/** Model capability guard shared by provider discovery and global AI routing. */
const NON_TEXT_MODEL_MARKERS = /(?:^|[-_.])(?:tts|image|video|audio|embedding|embeddings|embed|transcription|speech|live|realtime|veo|imagen|moderation)(?:[-_.]|$)/i;

export function supportsTextGenerationModel(provider: string, rawModel: string): boolean {
  const raw = String(rawModel || "").trim();
  const model = (raw.startsWith("models/") ? raw.slice("models/".length) : raw).trim();
  if (!model || model.length > 120 || NON_TEXT_MODEL_MARKERS.test(model)) return false;
  if (provider === "google") return /^gemini-/i.test(model);
  if (provider === "anthropic") return /^claude-/i.test(model);
  if (provider === "openai") return /^(?:gpt-|o[1-9]|chatgpt-)/i.test(model);
  return provider === "openai-compatible" && Boolean(model);
}
