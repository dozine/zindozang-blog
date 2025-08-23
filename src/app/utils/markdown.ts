export function extractTextFromMarkdown(markdown: string) {
  if (!markdown) return "";

  let text = markdown.replace(/<[^>]+>/g, "");
  text = text
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/(#+)\s+(.*)/g, "$2")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/~{1,2}(.*?)~{1,2}/g, "$1")
    .replace(/>\s?(.*)/g, "$1")
    .replace(/[*-]\s+(.*)/g, "$1");

  return text;
}
