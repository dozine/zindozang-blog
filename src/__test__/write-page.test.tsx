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
jest.mock(
  "@/components/imageUploader/ImageUploader",
  () =>
    function MockUploader({
      onUploadRequested,
      onImagesUploaded,
    }: {
      onUploadRequested: () => void;
      onImagesUploaded: (urls: string[]) => void;
    }) {
      return (
        <>
          <button onClick={onUploadRequested}>사진 선택</button>
          <button onClick={() => onImagesUploaded(["/photo.png"])}>업로드 완료</button>
          <button onClick={() => onImagesUploaded(["/first.png", "/second.png"])}>
            여러 장 완료
          </button>
        </>
      );
    }
);
jest.mock(
  "@/components/postSettingModal/PostSettingModal",
  () =>
    function MockSettings({ onPublish }: { onPublish: () => void }) {
      return <button onClick={onPublish}>저장 확인</button>;
    }
);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
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

const newPostRecoveryKey = "blog:post-recovery:v1:local:new";

test("작성 내용을 다시 열면 복구한다", () => {
  const { unmount } = render(<WritePage />);
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "임시 제목" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "임시 본문" } });
  unmount();
  render(<WritePage />);
  expect(screen.getByDisplayValue("임시 제목")).toBeTruthy();
  expect(screen.getByDisplayValue("임시 본문")).toBeTruthy();
  expect(screen.getByText("작성 중이던 내용을 복구했습니다.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "복구 알림 닫기" }));
  expect(screen.queryByText("작성 중이던 내용을 복구했습니다.")).toBeNull();
});

test("저장 성공 시 복구본을 삭제한다", async () => {
  mockCreate.mockResolvedValue({ slug: "saved" });
  render(<WritePage />);
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "제목" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "내용" } });
  expect(localStorage.getItem(newPostRecoveryKey)).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/posts/saved"));
  expect(localStorage.getItem(newPostRecoveryKey)).toBeNull();
});

test("저장 실패 시 복구본을 유지한다", async () => {
  mockCreate.mockRejectedValue(new Error("저장 실패"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  render(<WritePage />);
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "제목" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "내용" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith("저장 실패"));
  expect(localStorage.getItem(newPostRecoveryKey)).not.toBeNull();
});

test("수정 복구본은 새 글과 구분하고 서버 조회 이후 복구한다", () => {
  mockEditing = true;
  mockPostFetched = false;
  mockPost = { title: "서버 제목", desc: "서버 본문", img: [], tags: [] };
  localStorage.setItem(
    "blog:post-recovery:v1:local:edit:hello",
    JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      content: {
        title: "수정 복구본",
        value: "수정 내용",
        uploadedImages: ["/photo.png"],
        thumbnailImg: "/photo.png",
        catSlug: "dev",
        tags: [],
        isPublished: true,
        tagInput: "태그",
      },
    })
  );
  const { rerender } = render(<WritePage />);
  expect(screen.getByText("Loading...")).toBeTruthy();
  mockPostFetched = true;
  rerender(<WritePage />);
  expect(screen.getByDisplayValue("수정 복구본")).toBeTruthy();
  expect(screen.getByDisplayValue("수정 내용")).toBeTruthy();
  expect(localStorage.getItem(newPostRecoveryKey)).toBeNull();
});

test("손상된 복구본이 있어도 작성 화면을 연다", () => {
  localStorage.setItem(newPostRecoveryKey, "invalid json");
  render(<WritePage />);
  expect(screen.getByPlaceholderText("Title")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("읽을 수 없습니다");
});

test("게시글에 반영하지 않은 변경이 있으면 탭 닫기를 경고한다", () => {
  render(<WritePage />);
  const before = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(before);
  expect(before.defaultPrevented).toBe(false);
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "미저장 내용" } });
  const after = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(true);
});

test("저장소 쓰기가 실패하면 안내하고 입력 내용을 유지한다", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  render(<WritePage />);
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "유지할 내용" } });
  expect(screen.getByDisplayValue("유지할 내용")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("자동 보관에 실패");
});

test("이전 저장소 키의 복구본을 새 이름으로 이전한다", () => {
  const { unmount } = render(<WritePage />);
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "이전 내용" } });
  unmount();
  const stored = localStorage.getItem(newPostRecoveryKey)!;
  localStorage.removeItem(newPostRecoveryKey);
  localStorage.setItem("blog:post-draft:v1:local:new", stored);
  render(<WritePage />);
  expect(screen.getByDisplayValue("이전 내용")).toBeTruthy();
  expect(localStorage.getItem(newPostRecoveryKey)).toBe(stored);
  expect(localStorage.getItem("blog:post-draft:v1:local:new")).toBeNull();
});

test("사진을 본문 중간에 삽입하고 사진 뒤에 커서를 둔다", () => {
  render(<WritePage />);
  const editor = screen.getByLabelText("본문") as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: "앞 문단뒤 문단" } });
  editor.setSelectionRange(4, 7);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  const image = "\n\n![image](/photo.png)\n\n";
  expect(editor.value).toBe("앞 문단" + image + "뒤 문단");
  expect(editor.selectionStart).toBe(4 + image.length);
  expect(document.activeElement).toBe(editor);
});

test("업로드 중 앞쪽에 입력해도 기존 문맥의 삽입 위치를 유지한다", () => {
  render(<WritePage />);
  const editor = screen.getByLabelText("본문") as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: "앞뒤" } });
  editor.setSelectionRange(1, 1);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.change(editor, { target: { value: "추가앞뒤" } });
  editor.setSelectionRange(4, 4);
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  expect(editor.value).toBe("추가앞\n\n![image](/photo.png)\n\n뒤");
});

test("빈 본문에도 사진을 삽입한다", () => {
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  expect((screen.getByLabelText("본문") as HTMLTextAreaElement).value).toBe(
    "\n\n![image](/photo.png)\n\n"
  );
});

test("여러 사진을 기억한 커서 위치에 순서대로 삽입한다", () => {
  render(<WritePage />);
  const editor = screen.getByLabelText("본문") as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: "앞뒤" } });
  editor.setSelectionRange(1, 1);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "여러 장 완료" }));
  expect(editor.value).toBe("앞\n\n![image](/first.png)\n\n\n\n![image](/second.png)\n\n뒤");
  expect(screen.getAllByAltText(/uploaded-/)).toHaveLength(2);
});
