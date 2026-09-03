import { calculateReadingTime } from "../readingTime";

describe("calculateReadingTime", () => {
  it("returns at least 1 minute for very short content", () => {
    expect(calculateReadingTime("<p>Hello world</p>")).toBe(1);
  });

  it("strips HTML tags before counting words", () => {
    const html = "<p>" + "word ".repeat(400) + "</p>";
    expect(calculateReadingTime(html)).toBe(2);
  });

  it("scales roughly with word count at 200 words per minute", () => {
    const html = "<div>" + "word ".repeat(1000) + "</div>";
    expect(calculateReadingTime(html)).toBe(5);
  });
});
