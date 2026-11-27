import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SmartImage from "../SmartImage";

describe("SmartImage", () => {
  it("retries a new source after the previous source failed", async () => {
    const { rerender } = render(<SmartImage src="/missing-first-image.jpg" alt="Project cover"/>);

    fireEvent.error(screen.getByAltText("Project cover"));
    expect(screen.getByRole("img", { name: "Project cover" }).classList.contains("tgo-image-fallback")).toBe(true);

    rerender(<SmartImage src="/replacement-image.jpg" alt="Project cover"/>);

    await waitFor(() => {
      const replacement = screen.getByAltText("Project cover");
      expect(replacement.tagName).toBe("IMG");
      expect(replacement.getAttribute("src")).toBe("/replacement-image.jpg");
    });
  });

  it("keeps the accessible branded fallback when no source is supplied", () => {
    render(<SmartImage alt="Missing project cover"/>);
    expect(screen.getByRole("img", { name: "Missing project cover" }).classList.contains("tgo-image-fallback")).toBe(true);
  });
});
