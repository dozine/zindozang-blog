import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DeleteTagModal from "@/components/modal/tagModal/DeleteTagModal";
import { deleteTag } from "@/lib/services/tagService";
import { tagQueryKeys } from "@/queries/tag";
import { postQueryKeys } from "@/queries/post";

jest.mock("@/lib/services/tagService", () => ({ deleteTag: jest.fn() }));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(tagQueryKeys.all, []);
  client.setQueryData(postQueryKeys.detail("hello"), {});
  const onClose = jest.fn();
  const onSuccessDelete = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <DeleteTagModal
        isOpen
        onClose={onClose}
        onSuccessDelete={onSuccessDelete}
        tags={[{ id: "tag-1", name: "React", _count: { posts: 1 } }]}
      />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "tag-1" } });
  return { client, onClose, onSuccessDelete };
}

beforeEach(() => jest.resetAllMocks());

test("삭제 성공 시 관련 캐시를 갱신하고 모달을 닫는다", async () => {
  jest.mocked(deleteTag).mockResolvedValue({ success: true });
  const { client, onClose, onSuccessDelete } = setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(onSuccessDelete).toHaveBeenCalledWith("tag-1"));
  expect(deleteTag).toHaveBeenCalledWith("tag-1");
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(true);
  expect(client.getQueryState(postQueryKeys.detail("hello"))?.isInvalidated).toBe(true);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("삭제 실패 시 오류를 표시하고 모달을 유지한다", async () => {
  jest.mocked(deleteTag).mockResolvedValue({ success: false, error: "삭제할 수 없습니다" });
  const { client, onClose, onSuccessDelete } = setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(await screen.findByText("삭제할 수 없습니다")).toBeTruthy();
  expect(client.getQueryState(tagQueryKeys.all)?.isInvalidated).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  expect(onSuccessDelete).not.toHaveBeenCalled();
});

test("태그 선택을 바꾸면 이전 삭제 오류가 사라진다", async () => {
  jest.mocked(deleteTag).mockResolvedValue({ success: false, error: "삭제할 수 없습니다" });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(await screen.findByText("삭제할 수 없습니다")).toBeTruthy();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
  expect(screen.queryByText("삭제할 수 없습니다")).toBeNull();
});
