import DOMPurify from "isomorphic-dompurify";

export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "h1", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li",
      "blockquote", "a", "span", "br", "code", "pre",
      "table", "thead", "tbody", "tr", "th", "td", "img",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "style", "class",
      "src", "alt", "colspan", "rowspan",
    ],
  });
}
