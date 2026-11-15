import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatePost } from "@/queries/post";
import { useUpdatePost } from "@/queries/post";
import { postQueryKeys } from "@/queries/post";
import { tagQueryKeys } from "@/queries/tag";
import { createPost, updatePost } from "@/lib/services/postService";
import type { CreatePostResponse } from "@/types/api/post";

jest.mock("@/lib/services/postService", () => ({ createPost: jest.fn(), updatePost: jest.fn() }));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(postQueryKeys.detail("hello"), {});
  client.setQueryData(tagQueryKeys.all, []);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => jest.resetAllMocks());

test("게시글 생성 후 게시글과 태그 캐시를 갱신한다", async () => {
  jest.mocked(createPost).mockResolvedValue({ slug: "hello" } as CreatePostResponse);
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useCreatePost(), { wrapper });
  const body = { title: "Hello", desc: "Body", slug: "hello" };
  await act(async () => {
    await result.current.mutateAsync(body);
  });
  expect(jest.mocked(createPost).mock.calls[0][0]).toEqual(body);
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(true);
});

test("게시글 수정 실패 시 캐시를 갱신하지 않고 오류를 전달한다", async () => {
  jest.mocked(updatePost).mockRejectedValue(new Error("수정 실패"));
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useUpdatePost(), { wrapper });
  await act(async () => {
    await expect(
      result.current.mutateAsync({ slug: "hello", body: { title: "Hello", desc: "Body" } })
    ).rejects.toThrow("수정 실패");
  });
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(false);
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(false);
});

test("게시글 수정 성공 시 게시글과 태그 캐시를 갱신한다", async () => {
  jest.mocked(updatePost).mockResolvedValue(undefined);
  const { client, wrapper } = setup();
  const { result } = renderHook(() => useUpdatePost(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ slug: "hello", body: { title: "Hello", desc: "Body" } });
  });
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(true);
});
