import sanitizeHtml from "sanitize-html";

export function sanitizeBlogHtml(html: string): string {
  if (typeof html !== "string" || !html.trim()) {
    return "";
  }

  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "del",
      "ul", "ol", "li",
      "blockquote", "a", "span", "br",
      "code", "pre",
      "table", "thead", "tbody", "tr", "th", "td",
      "img", "figure", "figcaption", "hr", "sub", "sup",
    ],

    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "title", "width", "height", "class"],
      th: ["colspan", "rowspan", "scope", "class"],
      td: ["colspan", "rowspan", "class"],
      "*": ["class", "style"],
    },

    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,

    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic|oblique)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
        "color": [
          /^#[0-9a-fA-F]{3,8}$/,
          /^rgba?\([\d\s.,%]+\)$/,
          /^[a-zA-Z]+$/,
        ],
        "background-color": [
          /^#[0-9a-fA-F]{3,8}$/,
          /^rgba?\([\d\s.,%]+\)$/,
          /^[a-zA-Z]+$/,
        ],
        "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
        "width": [/^\d+(\.\d+)?(px|%|em|rem)$/],
        "height": [/^\d+(\.\d+)?(px|%|em|rem)$/],
        "max-width": [/^\d+(\.\d+)?(px|%|em|rem)$/],
      },
    },

    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });
}
