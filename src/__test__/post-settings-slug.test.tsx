import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";

jest.mock("@/queries/tag", () => ({
  useCreateTag: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
function Fixture({ editing = false }: { editing?: boolean }) {
  const [slug, setSlug] = useState(editing ? "existing-address" : "");
  return (
    <PostSettingModal
      isOpen
      onClose={() => {}}
      postTitle="원래 글 제목"
      slugInput={slug}
      setSlugInput={setSlug}
      isEditing={editing}
      catSlug=""
      setCatSlug={() => {}}
      isPublished={false}
      setIsPublished={() => {}}
      tagInput=""
      setTagInput={() => {}}
      tags={[]}
      setTags={() => {}}
      categories={[]}
      availableTags={[]}
      onPublish={() => {}}
      uploadedImages={[]}
      thumbnailImg=""
      setThumbnailImg={() => {}}
    />
  );
}
test("선택 주소 입력란을 비워두면 제목 기반 예상 주소를 표시한다", () => {
  render(<Fixture />);
  expect(screen.getByText("예상 주소: /posts/원래-글-제목")).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/게시글 주소/), { target: { value: "Custom URL" } });
  expect(screen.getByText("예상 주소: /posts/custom-url")).toBeTruthy();
});
test("게시글 수정에서는 현재 주소를 읽기 전용으로 표시한다", () => {
  render(<Fixture editing />);
  expect((screen.getByLabelText("게시글 주소") as HTMLInputElement).readOnly).toBe(true);
  expect(screen.getByDisplayValue("existing-address")).toBeTruthy();
  expect(screen.getByText("제목을 수정해도 게시글 주소는 유지됩니다.")).toBeTruthy();
});
