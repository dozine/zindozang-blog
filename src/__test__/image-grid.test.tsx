import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ImageGridPicker from "@/components/imageGridPicker/ImageGridPicker";
import { arrangeImageGrid } from "@/lib/utils/imageGrid";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = jest.fn();
});

test("클릭한 순서로 사진을 선택하고 배치한다", () => {
  const confirm = jest.fn();
  render(
    <ImageGridPicker
      columns={3}
      images={["/a.png", "/b.png", "/c.png"]}
      onClose={jest.fn()}
      onConfirm={confirm}
    />
  );
  const submit = screen.getByRole("button", {
    name: "배치하기",
    hidden: true,
  }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "사진 3", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "사진 1", hidden: true }));
  expect(submit.disabled).toBe(false);
  fireEvent.click(submit);
  expect(confirm).toHaveBeenCalledWith(["/c.png", "/a.png"]);
});

test("독립 사진을 제거하고 커서 위치를 보정해 그리드로 이동한다", () => {
  const text = "![image](/a.png)\n\n문단\n\n![image](/b.png)\n끝";
  const result = arrangeImageGrid(text, ["/b.png", "/a.png"], 2, text.indexOf("문단"));
  expect(result.value.match(/!\[image\]\(\/a.png\)/g)).toHaveLength(1);
  expect(result.value.match(/!\[image\]\(\/b.png\)/g)).toHaveLength(1);
  expect(result.value).toContain(
    '<div class="img-grid-2">\n\n![image](/b.png)\n\n![image](/a.png)'
  );
  expect(result.value.indexOf("</div>")).toBeLessThan(result.value.indexOf("문단"));
  expect(result.value).toContain("끝");
});

test("기존 그리드와 다른 본문 내용은 유지한다", () => {
  const original = '<div class="img-grid-2">\n\n![image](/a.png)\n\n![](/b.png)\n\n</div>';
  const result = arrangeImageGrid(original, ["/a.png", "/c.png"], 3, original.length);
  expect(result.value.startsWith(original)).toBe(true);
  expect(result.value).toContain('class="img-grid-3"');
});
