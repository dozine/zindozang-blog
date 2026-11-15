import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCategoriesQuery } from "@/queries/category";
import { fetchCategories } from "@/lib/services/categoryService";

jest.mock("@/lib/services/categoryService", () => ({
  fetchCategories: jest.fn(),
}));

const initialCategories = [{ id: "1", slug: "notes", title: "Notes", img: null }];
const updatedCategories = [
  ...initialCategories,
  { id: "2", slug: "work", title: "Work", img: null },
];
const fetchCategoriesMock = jest.mocked(fetchCategories);

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    {
      client: new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60000 } } }),
    },
    children
  );

beforeEach(() => {
  fetchCategoriesMock.mockReset();
});

test("refreshes the category list through the API service", async () => {
  fetchCategoriesMock.mockResolvedValue(updatedCategories);
  const { result } = renderHook(() => useCategoriesQuery(true, initialCategories), { wrapper });

  expect(result.current.data).toEqual(initialCategories);
  expect(fetchCategoriesMock).not.toHaveBeenCalled();

  await act(async () => {
    await result.current.refetch();
  });

  expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(result.current.data).toEqual(updatedCategories));
  expect(result.current.error).toBeNull();
  expect(result.current.isLoading).toBe(false);
});

test("reports refresh failures while retaining the current categories", async () => {
  fetchCategoriesMock.mockRejectedValue(new Error("카테고리 조회 실패"));
  const { result } = renderHook(() => useCategoriesQuery(true, initialCategories), { wrapper });
  expect(result.current.error).toBeNull();

  await act(async () => {
    await result.current.refetch();
  });

  expect(result.current.data).toEqual(initialCategories);
  await waitFor(() => expect(result.current.error?.message).toBe("카테고리 조회 실패"));
  expect(result.current.isLoading).toBe(false);
});

test("accepts an empty server list without fetching again", () => {
  const { result } = renderHook(() => useCategoriesQuery(true, []), { wrapper });
  expect(result.current.data).toEqual([]);
  expect(fetchCategoriesMock).not.toHaveBeenCalled();
});
