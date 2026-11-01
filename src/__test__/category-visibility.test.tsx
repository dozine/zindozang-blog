import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(main)/page";
import CategoryListClient from "@/components/categoryList/CategoryListClient";
import DeleteCategoryModal from "@/components/modal/categoryModal/DeleteCategoryModal";
import { getAllCategories } from "@/lib/data/category";

jest.mock("@/lib/data/category", () => ({ getAllCategories: jest.fn() }));
jest.mock("next-auth/react", () => ({ useSession: () => ({ status: "unauthenticated" }) }));

const categories = [
  { id: "notes", slug: "notes", title: "개발", img: null },
  { id: "other", slug: "uncategorized", title: "기타", img: null },
];

test("메인 화면에는 전체와 모든 카테고리를 표시한다", async () => {
  jest.mocked(getAllCategories).mockResolvedValue(categories);
  render(await HomePage());

  expect(screen.getByRole("link", { name: /All/ }).getAttribute("href")).toBe("/blog");
  expect(screen.getByRole("link", { name: /개발/ }).getAttribute("href")).toBe("/blog?cat=notes");
  expect(screen.getByRole("link", { name: /기타/ }).getAttribute("href")).toBe("/blog?cat=uncategorized");
});

test("블로그 메뉴에서 기존 예약 slug도 일반 카테고리로 표시한다", () => {
  render(<CategoryListClient initialCategories={categories} />);
  expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe("/blog");
  expect(screen.getByRole("link", { name: "개발" }).getAttribute("href")).toBe("/blog?cat=notes");
  expect(screen.getByRole("link", { name: "기타" }).getAttribute("href")).toBe("/blog?cat=uncategorized");
});

test("카테고리 삭제 전에 글이 보존된다고 안내한다", () => {
  render(<DeleteCategoryModal isOpen onClose={() => {}} onSuccess={async () => {}} categories={categories} />);
  expect(screen.getByText(/글은 삭제되지 않으며 전체 목록에서/)).toBeTruthy();
  expect(screen.getByRole("option", { name: "기타" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "개발" })).toBeTruthy();
});
