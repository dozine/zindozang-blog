import React from "react";
import type { ICommand } from "@uiw/react-md-editor";
import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WritePage from "@/app/(editor)/write/page";

function render(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPublishDraft = jest.fn();
const mockLoadDraft = jest.fn();
const mockSaveDraft = jest.fn();
const mockListDrafts = jest.fn();
const mockDeleteDraft = jest.fn();
let mockDraftId = "";
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
let mockEditing = false;
let mockPost: Record<string, unknown> | null = null;
let mockPostFetched = true;
let mockCategoryError: Error | null = null;
const mockCategoryRefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () =>
    new URLSearchParams(
      mockEditing ? "edit=true&slug=hello" : mockDraftId ? `draft=${mockDraftId}` : ""
    ),
}));
jest.mock("next-auth/react", () => ({ useSession: () => ({ status: "authenticated" }) }));
jest.mock("@/lib/services/draftService", () => ({
  publishDraft: (...args: unknown[]) => mockPublishDraft(...args),
  loadDraft: (...args: unknown[]) => mockLoadDraft(...args),
  saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
  listDrafts: () => mockListDrafts(),
  deleteDraft: (...args: unknown[]) => mockDeleteDraft(...args),
}));
jest.mock("@/queries/post", () => ({
  postQueryKeys: { all: ["posts"] },
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
  tagQueryKeys: { all: ["tags"] },
  useTagsQuery: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));
jest.mock(
  "@/components/post/PostContent",
  () => function MockPostContent({ desc, fontFamily }: { desc: string; fontFamily: string }) {
    return <div data-testid="post-preview" data-font={fontFamily}>{desc}</div>;
  }
);
jest.mock(
  "next/dynamic",
  () => () =>
    function MockEditor({
      value,
      onChange,
      commands = [],
      components,
    }: {
      value: string;
      onChange: (value: string) => void;
      commands?: ICommand[];
      components?: { preview: (source: string) => React.ReactNode };
    }) {
      return (
        <>
          {commands
            .filter((command) => command.name === "font-family")
            .map((command, index) => (
              <div key={command.name}>
                {command.render?.(command, false, jest.fn(), index) || null}
              </div>
            ))}
          <textarea
            aria-label="본문"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {components?.preview(value)}
        </>
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
    function MockSettings({
      onPublish,
      onSaveDraft,
      feedback,
      slugInput,
      setSlugInput,
      isEditing,
    }: {
      onPublish: () => void;
      onSaveDraft?: () => void;
      feedback?: string;
      slugInput: string;
      setSlugInput: (value: string) => void;
      isEditing: boolean;
    }) {
      return (
        <div role="dialog">
          <input
            aria-label="게시글 주소"
            value={slugInput}
            onChange={(event) => setSlugInput(event.target.value)}
            readOnly={isEditing}
          />
          <button onClick={onPublish}>저장 확인</button>
          {onSaveDraft && <button onClick={onSaveDraft}>초안 저장</button>}
          {feedback && <p role="status">{feedback}</p>}
        </div>
      );
    }
);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockDraftId = "";
  mockListDrafts.mockResolvedValue([]);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
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
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Post", desc: "내용", slug: "" })
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
  fireEvent.click(screen.getByRole("button", { name: "수정 반영" }));
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
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
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
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
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

test("사진 설명을 본문에 반영하고 설명을 바꾼 사진도 삭제한다", () => {
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  fireEvent.change(screen.getByLabelText("사진 1 캡션"), {
    target: { value: "바닷가의 노을" },
  });
  expect((screen.getByLabelText("본문") as HTMLTextAreaElement).value).toContain(
    '![](/photo.png "바닷가의 노을")'
  );
  fireEvent.click(screen.getByRole("button", { name: "사진 1 삭제" }));
  expect((screen.getByLabelText("본문") as HTMLTextAreaElement).value).not.toContain("/photo.png");
});

test("사진을 본문 중간에 삽입하고 사진 뒤에 커서를 둔다", () => {
  render(<WritePage />);
  const editor = screen.getByLabelText("본문") as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: "앞 문단뒤 문단" } });
  editor.setSelectionRange(4, 7);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  const image = "\n\n![](/photo.png)\n\n";
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
  expect(editor.value).toBe("추가앞\n\n![](/photo.png)\n\n뒤");
});

test("빈 본문에도 사진을 삽입한다", () => {
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "업로드 완료" }));
  expect((screen.getByLabelText("본문") as HTMLTextAreaElement).value).toBe(
    "\n\n![](/photo.png)\n\n"
  );
});

test("여러 사진을 기억한 커서 위치에 순서대로 삽입한다", () => {
  render(<WritePage />);
  const editor = screen.getByLabelText("본문") as HTMLTextAreaElement;
  fireEvent.change(editor, { target: { value: "앞뒤" } });
  editor.setSelectionRange(1, 1);
  fireEvent.click(screen.getByRole("button", { name: "사진 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "여러 장 완료" }));
  expect(editor.value).toBe("앞\n\n![](/first.png)\n\n\n\n![](/second.png)\n\n뒤");
  expect(screen.getAllByLabelText(/사진 \d 캡션/)).toHaveLength(2);
});

const draftContent = {
  slugInput: "",
  fontFamily: "serif" as const,
  title: "저장한 제목",
  value: "작성 중인 내용",
  uploadedImages: [],
  thumbnailImg: "",
  catSlug: "",
  tags: [],
  isPublished: false,
  tagInput: "",
};
const savedDraft = { id: "draft-1", updatedAt: "2026-11-27T03:00:00.000Z", content: draftContent };

test("제목 없이 모달에서 초안을 저장하고 같은 초안의 주소를 유지한다", async () => {
  mockSaveDraft.mockResolvedValue({ ...savedDraft, content: { ...draftContent, title: "" } });
  render(<WritePage />);
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "미완성 내용" } });
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  expect(window.alert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(mockSaveDraft).toHaveBeenCalledWith({
      content: expect.objectContaining({ title: "", value: "미완성 내용" }),
    })
  );
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/write?draft=draft-1"));
  expect(mockCreate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("저장된 초안을 불러와 다시 저장할 때 같은 ID와 저장 시각을 보낸다", async () => {
  mockDraftId = "draft-1";
  mockLoadDraft.mockResolvedValue(savedDraft);
  mockSaveDraft.mockResolvedValue({ ...savedDraft, updatedAt: "2026-11-27T04:00:00.000Z" });
  render(<WritePage />);
  await screen.findByDisplayValue("저장한 제목");
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "이어서 작성" } });
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(mockSaveDraft).toHaveBeenCalledWith({
      id: "draft-1",
      updatedAt: savedDraft.updatedAt,
      content: expect.objectContaining({ value: "이어서 작성" }),
    })
  );
  expect(mockCreate).not.toHaveBeenCalled();
});

test("초안을 게시하면 새 글 생성 대신 같은 글의 게시 전환을 요청한다", async () => {
  mockDraftId = "draft-1";
  mockLoadDraft.mockResolvedValue(savedDraft);
  mockPublishDraft.mockResolvedValue({ slug: "published-draft" });
  render(<WritePage />);
  await screen.findByDisplayValue("저장한 제목");
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockPublishDraft).toHaveBeenCalledWith(
      "draft-1",
      expect.objectContaining({ title: draftContent.title, updatedAt: savedDraft.updatedAt })
    )
  );
  expect(mockCreate).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/posts/published-draft");
});

test("게시된 글의 수정 화면에는 초안 불러오기와 저장을 제공하지 않는다", async () => {
  mockEditing = true;
  mockPost = { title: "게시된 글", desc: "본문", img: [], tags: [], isPublished: true };
  render(<WritePage />);
  await screen.findByDisplayValue("게시된 글");
  expect(screen.queryByRole("button", { name: "내 초안" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "수정 반영" }));
  expect(screen.queryByRole("button", { name: "초안 저장" })).toBeNull();
});

test("내 초안은 목록 모달을 열고 선택한 초안을 작성 화면에서 불러온다", async () => {
  mockListDrafts.mockResolvedValue([savedDraft]);
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "내 초안" }));
  fireEvent.click(await screen.findByRole("button", { name: "저장한 제목 초안 불러오기" }));
  expect(mockReplace).toHaveBeenCalledWith("/write?draft=draft-1");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("초안 저장 실패 시 모달과 입력 내용을 유지한다", async () => {
  mockSaveDraft.mockRejectedValue(new Error("초안을 저장할 수 없습니다."));
  render(<WritePage />);
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "실패해도 남을 내용" } });
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(screen.getByRole("dialog").textContent).toContain("초안을 저장할 수 없습니다.")
  );
  expect(screen.getByDisplayValue("실패해도 남을 내용")).toBeTruthy();
});

test("목록에서 삭제 확인 후 초안을 제거하고 브라우저 복구본도 지운다", async () => {
  mockListDrafts.mockResolvedValue([savedDraft]);
  mockDeleteDraft.mockResolvedValue(undefined);
  const confirm = jest
    .spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  const key = "blog:post-recovery:v1:local:draft:draft-1";
  localStorage.setItem(key, "recovery");
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "내 초안" }));
  const button = await screen.findByRole("button", { name: "저장한 제목 초안 삭제" });
  fireEvent.click(button);
  expect(mockDeleteDraft).not.toHaveBeenCalled();
  fireEvent.click(button);
  await screen.findByText(/저장한 초안이 없습니다/);
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(mockDeleteDraft).toHaveBeenCalledWith(savedDraft);
  expect(localStorage.getItem(key)).toBeNull();
});

test("삭제 실패 시 목록을 유지하고 오류를 표시한다", async () => {
  mockListDrafts.mockResolvedValue([savedDraft]);
  mockDeleteDraft.mockRejectedValue(new Error("다른 탭에서 초안이 변경되었습니다."));
  jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<WritePage />);
  fireEvent.click(screen.getByRole("button", { name: "내 초안" }));
  fireEvent.click(await screen.findByRole("button", { name: "저장한 제목 초안 삭제" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "다른 탭에서 초안이 변경되었습니다."
  );
  expect(screen.getByRole("button", { name: "저장한 제목 초안 불러오기" })).toBeTruthy();
});

test("작성 중인 초안을 삭제해도 편집 내용은 새 글로 유지하고 다음 저장은 새 초안으로 한다", async () => {
  mockDraftId = "draft-1";
  mockLoadDraft.mockResolvedValue(savedDraft);
  mockListDrafts.mockResolvedValue([savedDraft]);
  mockDeleteDraft.mockResolvedValue(undefined);
  mockSaveDraft.mockResolvedValue({ ...savedDraft, id: "new-draft" });
  jest.spyOn(window, "confirm").mockReturnValue(true);
  const { rerender } = render(<WritePage />);
  await screen.findByDisplayValue("저장한 제목");
  fireEvent.change(screen.getByLabelText("본문"), {
    target: { value: "삭제 후에도 남을 편집 내용" },
  });
  fireEvent.click(screen.getByRole("button", { name: "내 초안" }));
  fireEvent.click(await screen.findByRole("button", { name: "저장한 제목 초안 삭제" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/write"));
  mockDraftId = "";
  rerender(<WritePage />);
  await screen.findByDisplayValue("삭제 후에도 남을 편집 내용");
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(mockSaveDraft).toHaveBeenCalledWith({
      content: expect.objectContaining({ value: "삭제 후에도 남을 편집 내용" }),
    })
  );
});

test("작성 전용 상단 메뉴에 서비스 이름과 작성 버튼을 표시한다", () => {
  render(<WritePage />);
  expect(screen.getByRole("navigation", { name: "글 작성 메뉴" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "zindozang" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("button", { name: "내 초안" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "저장 및 게시" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Blog" })).toBeNull();
});

test("본문 글꼴을 바꾸면 미리보기 스타일과 게시 요청에 반영한다", async () => {
  mockCreate.mockResolvedValue({ slug: "font-post" });
  render(<WritePage />);
  fireEvent.click(screen.getByRole("combobox", { name: "본문 글꼴" }));
  fireEvent.click(screen.getByRole("option", { name: /고딕체/ }));
  const preview = screen.getByLabelText("본문").closest("[data-color-mode]") as HTMLElement;
  expect(preview.style.getPropertyValue("--post-font-family")).toBe(
    "var(--font-noto-sans-kr), sans-serif"
  );
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "글꼴 테스트" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "본문" } });
  expect(screen.getByTestId("post-preview").textContent).toBe("본문");
  expect(screen.getByTestId("post-preview").getAttribute("data-font")).toBe("sans");
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ fontFamily: "sans" }))
  );
});

test("초안의 본문 글꼴을 불러오고 변경한 글꼴을 다시 저장한다", async () => {
  mockDraftId = "draft-1";
  mockLoadDraft.mockResolvedValue({
    ...savedDraft,
    content: { ...draftContent, fontFamily: "nanum" },
  });
  mockSaveDraft.mockResolvedValue(savedDraft);
  render(<WritePage />);
  await screen.findByDisplayValue("저장한 제목");
  expect(screen.getByRole("combobox", { name: "본문 글꼴" }).textContent).toContain("나눔고딕");
  fireEvent.click(screen.getByRole("combobox", { name: "본문 글꼴" }));
  fireEvent.click(screen.getByRole("option", { name: /고딕체/ }));
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(mockSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ fontFamily: "sans" }) })
    )
  );
});

test("직접 입력한 주소는 게시 요청에 전달하고 초안 저장에도 보관한다", async () => {
  mockPublishDraft.mockResolvedValue({ slug: "custom-address" });
  mockSaveDraft.mockResolvedValue({
    ...savedDraft,
    content: { ...draftContent, slugInput: "Custom Address" },
  });
  render(<WritePage />);
  fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "다른 제목" } });
  fireEvent.change(screen.getByLabelText("본문"), { target: { value: "본문" } });
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.change(screen.getByLabelText("게시글 주소"), { target: { value: "Custom Address" } });
  fireEvent.click(screen.getByRole("button", { name: "초안 저장" }));
  await waitFor(() =>
    expect(mockSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ slugInput: "Custom Address" }) })
    )
  );
  fireEvent.click(screen.getByRole("button", { name: "저장 및 게시" }));
  fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
  await waitFor(() =>
    expect(mockPublishDraft).toHaveBeenCalledWith(
      savedDraft.id,
      expect.objectContaining({ slug: "Custom Address" })
    )
  );
});
