import { findMarkdownImages, removeMarkdownImage, updateImageCaption } from "@/lib/utils/markdownImage";
import { arrangeImageGrid } from "@/lib/utils/imageGrid";

test("특수 문자가 포함된 설명을 안전하게 저장하고 다시 읽는다", () => {
  const caption = '가을 [풍경]과 *별*, \\ 경로 <사진> &amp; "노을"';
  const updated = updateImageCaption("![](/photo.png)\n![다른 사진](/other.png)", "/photo.png", caption);
  expect(findMarkdownImages(updated)).toEqual([
    expect.objectContaining({ caption, url: "/photo.png" }),
    expect.objectContaining({ alt: "다른 사진", url: "/other.png" }),
  ]);
  expect(removeMarkdownImage(updated, "/photo.png")).toBe("\n![다른 사진](/other.png)");
});

test("설명을 지우거나 같은 사진의 여러 위치를 수정한다", () => {
  const text = '![앞](/photo.png "기존 캡션")\n![뒤](/photo.png "기존 캡션")';
  expect(updateImageCaption(text, "/photo.png", "")).toBe("![앞](/photo.png)\n![뒤](/photo.png)");
});

test("그리드로 배치해도 특수 문자가 포함된 캡션을 유지한다", () => {
  const text = updateImageCaption("![](/photo.png)", "/photo.png", "풍경 [가을]");
  const grid = arrangeImageGrid(text, ["/photo.png", "/other.png"], 2, text.length);
  expect(findMarkdownImages(grid.value)).toEqual([
    expect.objectContaining({ caption: "풍경 [가을]", url: "/photo.png" }),
    expect.objectContaining({ alt: "", url: "/other.png" }),
  ]);
});
