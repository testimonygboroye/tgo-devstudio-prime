import { slugify } from "../slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("TGO DevStudio: Prime!")).toBe("tgo-devstudio-prime");
  });

  it("handles multiple consecutive spaces", () => {
    expect(slugify("Too   Many   Spaces")).toBe("too-many-spaces");
  });
});
