import { findMarkdownImages } from "./markdownImage";

/** 기존 그리드 안의 사진은 유지하고, 선택한 독립 사진을 한 그리드로 묶는다. */
export function arrangeImageGrid(text: string, urls: string[], columns: 2 | 3, position: number) {
  const images = new Map(findMarkdownImages(text).map((image) => [image.url, image.markdown]));
  const targets = new Set(urls);
  let offset = 0;
  let removedBefore = 0;
  const cleaned = text
    .split(/(<div\s+class=["']img-grid-[23]["'][\s\S]*?<\/div>)/g)
    .map((part) => {
      const isGrid = /^<div\s+class=["']img-grid-[23]["']/.test(part);
      if (isGrid) {
        offset += part.length;
        return part;
      }
      return part
        .split(/(?<=\n)/)
        .map((line) => {
          const start = offset;
          offset += line.length;
          const image = findMarkdownImages(line)[0];
          if (!image || image.markdown !== line.trim() || !targets.has(image.url)) return line;
          removedBefore += Math.max(0, Math.min(position - start, line.length));
          return "";
        })
        .join("");
    })
    .join("");
  const anchor = Math.max(0, Math.min(position - removedBefore, cleaned.length));
  const grid = `\n\n<div class="img-grid-${columns}">\n\n${urls.map((url) => images.get(url) ?? `![](${url})`).join("\n\n")}\n\n</div>\n\n`;
  return {
    value: cleaned.slice(0, anchor) + grid + cleaned.slice(anchor),
    caret: anchor + grid.length,
  };
}
