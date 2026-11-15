import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PostDeleteModal from "@/components/modal/postModal/PostDeleteModal";
import { usePostActions } from "@/hooks/post/usePostAction";
import { postQueryKeys } from "@/queries/post";
import { tagQueryKeys } from "@/queries/tag";
import { deletePost } from "@/lib/services/postService";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/services/postService", () => ({ deletePost: jest.fn() }));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(postQueryKeys.detail("hello"), {});
  client.setQueryData(tagQueryKeys.all, []);
  const onSuccess = jest.fn();
  function TestPage() {
    const { isDeleteModalOpen, openDeleteModal, closeDeleteModal } = usePostActions("hello");
    return (
      <>
        <button onClick={openDeleteModal}>모달 열기</button>
        <PostDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          slug="hello"
          onSuccess={onSuccess}
        />
      </>
    );
  }
  render(
    <QueryClientProvider client={client}>
      <TestPage />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "모달 열기" }));
  return { client, onSuccess };
}

beforeEach(() => jest.resetAllMocks());

test("게시글 삭제 성공 시 관련 캐시를 갱신하고 모달을 닫는다", async () => {
  jest.mocked(deletePost).mockResolvedValue(undefined);
  jest.spyOn(window, "alert").mockImplementation(() => {});
  const { client, onSuccess } = setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByText("정말 이 포스트를 삭제하시겠습니까?")).toBeNull());
  expect(jest.mocked(deletePost).mock.calls[0][0]).toBe("hello");
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(true);
  jest.restoreAllMocks();
});

test("게시글 삭제 실패 시 오류를 표시하고 모달을 유지한다", async () => {
  jest.mocked(deletePost).mockRejectedValue(new Error("삭제할 수 없습니다"));
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { client, onSuccess } = setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(await screen.findByText(/삭제할 수 없습니다/)).toBeTruthy();
  expect(screen.getByText("정말 이 포스트를 삭제하시겠습니까?")).toBeTruthy();
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(false);
  expect(onSuccess).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});

test("삭제 실패 후 모달을 다시 열면 이전 오류가 사라진다", async () => {
  jest.mocked(deletePost).mockRejectedValue(new Error("삭제할 수 없습니다"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(await screen.findByText(/삭제할 수 없습니다/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  fireEvent.click(screen.getByRole("button", { name: "모달 열기" }));
  expect(screen.queryByText(/삭제할 수 없습니다/)).toBeNull();
});
