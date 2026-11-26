import { supportsTextGenerationModel } from "@/lib/ai/model-capabilities";

describe("supportsTextGenerationModel", () => {
  it("accepts supported Gemini text models", () => {
    expect(supportsTextGenerationModel("google", "gemini-3.5-flash-lite")).toBe(true);
    expect(supportsTextGenerationModel("google", "models/gemini-3.1-pro-preview")).toBe(true);
  });

  it("rejects Gemini image, audio, TTS and embedding models", () => {
    for (const model of ["gemini-3.8-flash-lite-tts", "gemini-3.1-flash-image", "gemini-embedding-001", "gemini-live-2.5-flash"]) {
      expect(supportsTextGenerationModel("google", model)).toBe(false);
    }
  });

  it("accepts supported Claude and OpenAI chat models", () => {
    expect(supportsTextGenerationModel("anthropic", "claude-sonnet-4-5")).toBe(true);
    expect(supportsTextGenerationModel("openai", "gpt-4.1-mini")).toBe(true);
  });

  it("rejects non-chat OpenAI models", () => {
    expect(supportsTextGenerationModel("openai", "text-embedding-3-large")).toBe(false);
    expect(supportsTextGenerationModel("openai", "gpt-image-1")).toBe(false);
  });
});
