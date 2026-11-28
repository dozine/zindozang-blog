import { fetchCategories, addCategory, deleteCategory } from "@/lib/services/categoryService";
import { fetchAvailableTags, createTag, deleteTag } from "@/lib/services/tagService";
import { createPost, fetchPostBySlug, updatePost, deletePost } from "@/lib/services/postService";
import { visitorService } from "@/lib/services/visitorService";

const mockFetch = jest.fn();
const originalFetch = global.fetch;
const jsonResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

test("카테고리 조회는 유효한 응답만 반환한다", async () => {
  mockFetch.mockResolvedValueOnce(
    jsonResponse([{ id: "1", slug: "note", title: "Note", img: null }])
  );
  await expect(fetchCategories()).resolves.toEqual([
    { id: "1", slug: "note", title: "Note", img: null },
  ]);
  mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1, title: "Note" }]));
  await expect(fetchCategories()).rejects.toThrow("서버 응답 형식이 올바르지 않습니다.");
});

test("카테고리 생성의 잘못된 성공 응답은 실패로 처리한다", async () => {
  mockFetch.mockResolvedValue(jsonResponse({ message: "ok", category: { id: 1 } }, 201));
  await expect(addCategory("notes")).resolves.toEqual({
    success: false,
    error: "서버 응답 형식이 올바르지 않습니다.",
  });
});

test("태그 목록의 잘못된 개수는 거부하고 중복 태그 응답은 유지한다", async () => {
  mockFetch.mockResolvedValueOnce(
    jsonResponse([{ id: "1", name: "React", _count: { posts: "1" } }])
  );
  await expect(fetchAvailableTags()).rejects.toThrow("서버 응답 형식이 올바르지 않습니다.");
  mockFetch.mockResolvedValueOnce(jsonResponse({ id: "1", name: "React" }, 409));
  await expect(createTag("React")).resolves.toEqual({
    success: false,
    error: "이미 존재하는 태그입니다.",
    existingTag: { id: "1", name: "React" },
  });
});

test("게시글 조회와 생성은 응답의 필수 필드를 검사한다", async () => {
  const post = {
    fontFamily: "serif",
    id: "1",
    createdAt: "2026-01-01T00:00:00.000Z",
    slug: "hello",
    title: "Hello",
    desc: "Body",
    img: [],
    views: 1,
    isPublished: true,
    catSlug: null,
    tags: [],
    user: { id: "u", name: null, image: null },
  };
  mockFetch.mockResolvedValueOnce(jsonResponse(post));
  await expect(fetchPostBySlug("hello")).resolves.toEqual(post);
  mockFetch.mockResolvedValueOnce(jsonResponse({ slug: "hello" }, 201));
  await expect(createPost({ slug: "hello", title: "Hello", desc: "Body" })).rejects.toThrow(
    "서버 응답 형식이 올바르지 않습니다."
  );
});

test("이미 완료된 게시글 수정은 응답 본문 없이도 성공으로 처리한다", async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn() });
  await expect(updatePost("hello", { title: "Hello", desc: "Body" })).resolves.toBeUndefined();
});

test("방문자 통계와 방문 기록의 응답을 각각 검증한다", async () => {
  mockFetch.mockResolvedValueOnce(jsonResponse({ todayVisitors: 1, totalVisitors: 2 }));
  await expect(visitorService.getStats()).resolves.toEqual({ todayVisitors: 1, totalVisitors: 2 });
  mockFetch.mockResolvedValueOnce(
    jsonResponse({ todayVisitors: 1, totalVisitors: 2, counted: "true" })
  );
  await expect(visitorService.trackVisitor()).rejects.toThrow(
    "서버 응답 형식이 올바르지 않습니다."
  );
});

test("오류 응답 형식이 잘못되어도 요청별 기본 오류를 표시한다", async () => {
  mockFetch.mockResolvedValueOnce(jsonResponse({ message: 123 }, 500));
  await expect(fetchPostBySlug("hello")).rejects.toThrow("게시글을 불러올 수 없습니다.");
  mockFetch.mockResolvedValueOnce(jsonResponse({ message: "권한이 없습니다" }, 403));
  await expect(createTag("React")).resolves.toEqual({ success: false, error: "권한이 없습니다" });
});

test("동적 경로와 쿼리 값의 특수 문자를 인코딩해 전송한다", async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200 });

  await updatePost("한글/제목?#", { title: "제목", desc: "본문" });
  expect(mockFetch).toHaveBeenLastCalledWith(
    "/api/posts/%ED%95%9C%EA%B8%80%2F%EC%A0%9C%EB%AA%A9%3F%23",
    expect.objectContaining({ method: "PUT" })
  );

  await deletePost("a/b");
  expect(mockFetch).toHaveBeenLastCalledWith(
    "/api/posts/a%2Fb",
    expect.objectContaining({ method: "DELETE" })
  );

  await deleteTag("tag/1");
  expect(mockFetch).toHaveBeenLastCalledWith(
    "/api/tags/tag%2F1",
    expect.objectContaining({ method: "DELETE" })
  );

  await deleteCategory("a&b=1");
  expect(mockFetch).toHaveBeenLastCalledWith(
    "/api/categories?id=a%26b%3D1",
    expect.objectContaining({ method: "DELETE" })
  );
});

test("한글 게시글 삭제 URL은 한 번만 인코딩한다", async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200 });
  await deletePost("test-랑께");
  expect(mockFetch).toHaveBeenCalledWith(
    `/api/posts/${encodeURIComponent("test-랑께")}`,
    expect.objectContaining({ method: "DELETE" })
  );
  expect(mockFetch.mock.calls[0][0]).not.toContain("%25");
});
