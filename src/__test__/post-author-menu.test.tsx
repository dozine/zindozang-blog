import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SinglePageClient from "@/app/(blog)/posts/[slug]/singlePageClient";
import type { PostDetailView } from "@/types/post";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush, refresh: jest.fn() }) }));
jest.mock("@/hooks/useUtterances", () => ({ useUtterances: () => false }));
jest.mock(
  "@/components/post/PostContent",
  () =>
    function MockPostContent() {
      return <div>글 본문</div>;
    }
);
jest.mock(
  "@/components/modal/postModal/PostDeleteModal",
  () =>
    function MockPostDeleteModal() {
      return null;
    }
);

const data: PostDetailView = {
  id: "post-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  slug: "hello",
  title: "Hello",
  desc: "Body",
  img: [],
  views: 1,
  isPublished: true,
  catSlug: "notes",
  user: { id: "user-1", name: "Admin", image: null },
  tags: [],
  isAuthor: false,
};

test("only the verified author sees post management controls", () => {
  const { rerender } = render(<SinglePageClient data={data} slug="hello" />);
  expect(screen.queryByRole("button", { name: "포스트 메뉴 열기" })).toBeNull();

  rerender(<SinglePageClient data={{ ...data, isAuthor: true }} slug="hello" />);
  fireEvent.click(screen.getByRole("button", { name: "포스트 메뉴 열기" }));
  expect(screen.getByRole("button", { name: "수정하기" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "삭제하기" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "수정하기" }));
  expect(mockPush).toHaveBeenCalledWith("/write?edit=true&slug=hello");
});
