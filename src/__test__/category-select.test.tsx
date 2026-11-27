import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CategorySelect from "@/components/postSettingModal/CategorySelect";

function Fixture({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <CategorySelect
      value={value}
      onChange={setValue}
      disabled={disabled}
      categories={[{ id: "category-1", slug: "dev", title: "개발", img: null }]}
    />
  );
}

test("카테고리를 선택하면 선택값을 표시하고 목록을 닫는다", () => {
  render(<Fixture />);
  fireEvent.click(screen.getByRole("combobox", { name: "카테고리" }));
  fireEvent.click(screen.getByRole("option", { name: /개발/ }));
  expect(screen.getByRole("combobox").textContent).toContain("개발");
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("방향키와 Enter로 선택하고 Escape로 닫을 수 있다", () => {
  render(<Fixture />);
  const trigger = screen.getByRole("combobox");
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(trigger.textContent).toContain("개발");
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("목록 밖을 누르면 닫고 비활성 상태에서는 열리지 않는다", () => {
  const { rerender } = render(<Fixture />);
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("listbox")).toBeNull();
  rerender(<Fixture disabled />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.queryByRole("listbox")).toBeNull();
});
