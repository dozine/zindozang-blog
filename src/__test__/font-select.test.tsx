import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import FontSelect from "@/components/writeEditor/FontSelect";
import type { PostFont } from "@/types/post";

function Fixture() {
  const [value, setValue] = useState<PostFont>("serif");
  return <FontSelect value={value} onChange={setValue} disabled={false} />;
}

test("커스텀 목록에서 글꼴을 선택하고 선택 표시를 갱신한다", () => {
  render(<Fixture />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.getByRole("listbox", { name: "본문 글꼴 목록" })).toBeTruthy();
  fireEvent.click(screen.getByRole("option", { name: /나눔고딕/ }));
  expect(screen.getByRole("combobox").textContent).toContain("나눔고딕");
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.getByRole("option", { name: /나눔고딕/ }).getAttribute("aria-selected")).toBe(
    "true"
  );
});

test("키보드 선택과 Escape 및 바깥 클릭으로 닫기를 지원한다", () => {
  render(<Fixture />);
  const trigger = screen.getByRole("combobox");
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: "End" });
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(trigger.textContent).toContain("시스템 기본");
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.click(trigger);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("추가한 한글 글꼴을 목록에서 선택할 수 있다", () => {
  render(<Fixture />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(7);
  fireEvent.click(screen.getByRole("option", { name: /고운바탕/ }));
  expect(screen.getByRole("combobox").textContent).toContain("고운바탕");
});
