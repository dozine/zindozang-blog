const imagePattern = () => /!\[((?:\\.|[^\]\\])*)\]\(([^\s)]+)(?:\s+"((?:\\.|[^"\\])*)")?\)/g;
const unescapeMarkdown = (text: string) =>
  text.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, "$1");

export function findMarkdownImages(text: string) {
  return Array.from(text.matchAll(imagePattern()), (match) => ({
    markdown: match[0],
    alt: unescapeMarkdown(match[1]),
    caption: unescapeMarkdown(match[3] ?? ""),
    url: match[2],
  }));
}

export function updateImageCaption(text: string, url: string, caption: string) {
  const escaped = caption.replace(/\r?\n/g, " ").replace(/([\\"&<>])/g, "\\$1");
  return text.replace(imagePattern(), (markdown, alt: string, source: string) =>
    source === url ? `![${alt}](${source}${escaped ? ` "${escaped}"` : ""})` : markdown
  );
}

export function removeMarkdownImage(text: string, url: string) {
  return text.replace(imagePattern(), (markdown, _alt: string, source: string) =>
    source === url ? "" : markdown
  );
}
