import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAddCategoryModal } from "@/hooks/category/useAddCategoryModal";
import { categoryQueryKeys } from "@/queries/category";
import { addCategory } from "@/lib/services/categoryService";

jest.mock("@/lib/services/categoryService", () => ({ addCategory: jest.fn() }));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(categoryQueryKeys.all, []);
  const onClose = jest.fn();
  const onSuccess = jest.fn().mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useAddCategoryModal({ isOpen: true, onClose, onSuccess }), {
    wrapper,
  });
  return { client, onClose, onSuccess, ...hook };
}

beforeEach(() => jest.resetAllMocks());

test("카테고리 생성 성공 시 캐시를 무효화하고 모달을 닫는다", async () => {
  jest.mocked(addCategory).mockResolvedValue({ success: true });
  const { result, client, onClose, onSuccess } = setup();
  act(() => result.current.setTitle("Work"));
  await act(async () => {
    await result.current.handleSubmit();
  });
  expect(client.getQueryState(categoryQueryKeys.all)?.isInvalidated).toBe(true);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

test("카테고리 생성 실패 시 오류를 보여주고 모달을 유지한다", async () => {
  jest.mocked(addCategory).mockResolvedValue({ success: false, error: "이미 존재합니다" });
  const { result, client, onClose, onSuccess } = setup();
  act(() => result.current.setTitle("Work"));
  await act(async () => {
    await result.current.handleSubmit();
  });
  await waitFor(() => expect(result.current.error).toBe("이미 존재합니다"));
  expect(client.getQueryState(categoryQueryKeys.all)?.isInvalidated).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
});
