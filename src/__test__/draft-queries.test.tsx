import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useDraftsQuery,
  useDraftQuery,
  useSaveDraft,
  useDeleteDraft,
  usePublishDraft,
  draftQueryKeys,
} from "@/queries/draft";
import {
  listDrafts,
  loadDraft,
  saveDraft,
  deleteDraft,
  publishDraft,
} from "@/lib/services/draftService";
import { postQueryKeys } from "@/queries/post";
import { tagQueryKeys } from "@/queries/tag";
import type { CreatePostResponse } from "@/types/api/post";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: { email: "me@example.test" } } }),
}));
jest.mock("@/lib/services/draftService", () => ({
  listDrafts: jest.fn(),
  loadDraft: jest.fn(),
  saveDraft: jest.fn(),
  deleteDraft: jest.fn(),
  publishDraft: jest.fn(),
}));
const account = "me@example.test";
const content = {
  fontFamily: "serif" as const,
  title: "초안",
  value: "본문",
  uploadedImages: [],
  thumbnailImg: "",
  catSlug: "",
  tags: [],
  isPublished: false,
  tagInput: "",
};
const draft = { id: "draft-1", updatedAt: "2026-11-27T03:00:00.000Z", content };
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => jest.resetAllMocks());

test("초안 목록과 상세는 계정별 Query 키를 사용한다", async () => {
  jest.mocked(listDrafts).mockResolvedValue([draft]);
  jest.mocked(loadDraft).mockResolvedValue(draft);
  const { client, wrapper } = setup();
  const { result } = renderHook(
    () => ({ list: useDraftsQuery(), detail: useDraftQuery(draft.id) }),
    { wrapper }
  );
  await waitFor(() =>
    expect(result.current.detail.isSuccess && result.current.list.isSuccess).toBe(true)
  );
  expect(client.getQueryData(draftQueryKeys.list(account))).toEqual([draft]);
  expect(client.getQueryData(draftQueryKeys.detail(account, draft.id))).toEqual(draft);
  expect(client.getQueryData(draftQueryKeys.list("another@example.test"))).toBeUndefined();
  expect(loadDraft).toHaveBeenCalledWith(draft.id);
});

test("비활성 초안 조회는 요청하지 않는다", () => {
  const { wrapper } = setup();
  renderHook(() => ({ list: useDraftsQuery(false), detail: useDraftQuery("", false) }), {
    wrapper,
  });
  expect(listDrafts).not.toHaveBeenCalled();
  expect(loadDraft).not.toHaveBeenCalled();
});

test("초안 저장은 상세 캐시를 갱신하고 목록을 무효화한다", async () => {
  jest.mocked(saveDraft).mockResolvedValue(draft);
  const { client, wrapper } = setup();
  client.setQueryData(draftQueryKeys.list(account), []);
  const { result } = renderHook(() => useSaveDraft(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ content });
  });
  expect(client.getQueryData(draftQueryKeys.detail(account, draft.id))).toEqual(draft);
  expect(client.getQueryState(draftQueryKeys.list(account))?.isInvalidated).toBe(true);
});

test("초안 삭제 성공 시 내 목록에서만 제거하고 상세를 무효화한다", async () => {
  jest.mocked(deleteDraft).mockResolvedValue({ success: true });
  const { client, wrapper } = setup();
  client.setQueryData(draftQueryKeys.list(account), [draft]);
  client.setQueryData(draftQueryKeys.detail(account, draft.id), draft);
  client.setQueryData(draftQueryKeys.list("another@example.test"), [draft]);
  const { result } = renderHook(() => useDeleteDraft(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(draft);
  });
  expect(client.getQueryData(draftQueryKeys.list(account))).toEqual([]);
  expect(client.getQueryData(draftQueryKeys.list("another@example.test"))).toEqual([draft]);
  expect(client.getQueryState(draftQueryKeys.detail(account, draft.id))?.isInvalidated).toBe(true);
});

test("삭제 실패 시 캐시의 초안을 유지한다", async () => {
  jest.mocked(deleteDraft).mockRejectedValue(new Error("삭제 실패"));
  const { client, wrapper } = setup();
  client.setQueryData(draftQueryKeys.list(account), [draft]);
  const { result } = renderHook(() => useDeleteDraft(), { wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync(draft)).rejects.toThrow("삭제 실패");
  });
  expect(client.getQueryData(draftQueryKeys.list(account))).toEqual([draft]);
  expect(client.getQueryState(draftQueryKeys.list(account))?.isInvalidated).toBe(false);
});

test("초안 게시 후 초안 목록과 게시글·태그 캐시를 갱신한다", async () => {
  jest.mocked(publishDraft).mockResolvedValue({ slug: "published" } as CreatePostResponse);
  const { client, wrapper } = setup();
  client.setQueryData(draftQueryKeys.list(account), [draft]);
  client.setQueryData(postQueryKeys.detail("published"), {});
  client.setQueryData(tagQueryKeys.all, []);
  const { result } = renderHook(() => usePublishDraft(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({
      id: draft.id,
      body: { title: content.title, desc: content.value, updatedAt: draft.updatedAt },
    });
  });
  expect(client.getQueryData(draftQueryKeys.list(account))).toEqual([]);
  expect(client.getQueryState(postQueryKeys.detail("published"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(true);
});
