import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WritePage from "@/app/(blog)/write/page";

const mockPush = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
let mockEditing = false;
let mockPost: Record<string, unknown> | null = null;
let mockPostFetched = true;
let mockCategoryError: Error | null = null;
const mockCategoryRefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockEditing ? "edit=true&slug=hello" : ""),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ status: "authenticated" }) }));
jest.mock("@/queries/post", () => ({
  useCreatePost: () => ({ mutateAsync: mockCreate }),
  useUpdatePost: () => ({ mutateAsync: mockUpdate }),
  usePostQuery: () => ({
    data: mockPost,
    isLoading: false,
    isFetchedAfterMount: mockPostFetched,
    isError: false,
    error: null,
  }),
}));
jest.mock("@/queries/category", () => ({
  useCategoriesQuery: () => ({
    data: [],
    isLoading: false,
    isError: Boolean(mockCategoryError),
    error: mockCategoryError,
    refetch: mockCategoryRefetch,
  }),
}));
jest.mock("@/queries/tag", () => ({
  useTagsQuery: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));
jest.mock(
  "next/dynamic",
  () => () =>
    function MockEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
      return (
        <textarea
          aria-label="본문"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
);
jest.mock("@/components/imageUploader/ImageUploader", () => () => null);
jest.mock(
  "@/components/postSettingModal/PostSettingModal",
  () =>
    function MockSettings({ onPublish }: { onPublish: () => void }) {
      return <button onClick={onPublish}>저장 확인</button>;
    }
);

beforeEach(() => {
  jest.clearAllMocks();
  mockEditing = false;
  mockPost = null;
  mockPostFetched = true;
  mockCategoryError = null;
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test("새 글을 작성하고 저장한다", async () => {
  mockCreate.mockResolvedValue({ slug: "new-post" });
  render(<WritePage />);
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "New Post" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "내용" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Post", desc: "내용", slug: "new-post" })
    )
  );
  expect(mockPush).toHaveBeenCalledWith("/posts/new-post");
});

test("기존 글을 불러와 수정한 내용을 저장한다", async () => {
  mockEditing = true;
  mockPost = {
    title: "기존 제목",
    desc: "기존 내용",
    img: [],
    tags: [],
    catSlug: null,
    isPublished: false,
  };
  mockUpdate.mockResolvedValue(undefined);
  render(<WritePage />);
  await waitFor(() => expect(screen.getByDisplayValue("기존 제목")).toBeTruthy());
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "수정한 제목" } });
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "hello",
        body: expect.objectContaining({ title: "수정한 제목", desc: "기존 내용" }),
      })
    )
  );
  expect(mockPush).toHaveBeenCalledWith("/posts/hello");
});

test("데이터 조회가 실패하면 오류와 재시도를 보여준다", () => {
  mockCategoryError = new Error("카테고리 조회 실패");
  render(<WritePage />);
  expect(screen.getByText(/카테고리 조회 실패/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(mockCategoryRefetch).toHaveBeenCalledTimes(1);
});

test("수정 화면은 캐시된 글이 있어도 새 조회가 끝난 뒤 에디터를 연다", () => {
  mockEditing = true;
  mockPostFetched = false;
  mockPost = { title: "오래된 제목", desc: "오래된 내용", img: [], tags: [] };
  const { rerender } = render(<WritePage />);
  expect(screen.getByText("Loading...")).toBeTruthy();
  expect(screen.queryByDisplayValue("오래된 제목")).toBeNull();
  mockPostFetched = true;
  mockPost = { title: "최신 제목", desc: "최신 내용", img: [], tags: [] };
  rerender(<WritePage />);
  expect(screen.getByDisplayValue("최신 제목")).toBeTruthy();
});
