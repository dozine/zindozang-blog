import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetchCategories } from "@/hooks/category/useFetchCategories";
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

beforeEach(() => {
  fetchCategoriesMock.mockReset();
});

test("refreshes the category list through the API service", async () => {
  fetchCategoriesMock.mockResolvedValue(updatedCategories);
  const { result } = renderHook(() => useFetchCategories(initialCategories));

  expect(result.current.categories).toEqual(initialCategories);
  expect(fetchCategoriesMock).not.toHaveBeenCalled();

  await act(async () => {
    await result.current.refreshCategories();
  });

  expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
  expect(result.current.categories).toEqual(updatedCategories);
  expect(result.current.error).toBeNull();
  expect(result.current.isLoading).toBe(false);
});

test("reports refresh failures while retaining the current categories", async () => {
  fetchCategoriesMock.mockRejectedValue(new Error("카테고리 조회 실패"));
  const { result } = renderHook(() => useFetchCategories(initialCategories));

  await act(async () => {
    await result.current.refreshCategories();
  });

  expect(result.current.categories).toEqual(initialCategories);
  expect(result.current.error).toBe("카테고리 조회 실패");
  expect(result.current.isLoading).toBe(false);
});

test("loads categories when the initial list is empty", async () => {
  fetchCategoriesMock.mockResolvedValue(updatedCategories);
  const emptyCategories: typeof initialCategories = [];
  const { result } = renderHook(() => useFetchCategories(emptyCategories));

  await waitFor(() => expect(result.current.categories).toEqual(updatedCategories));
  expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
  expect(result.current.isLoading).toBe(false);
});
