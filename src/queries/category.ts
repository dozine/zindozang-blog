"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCategory, deleteCategory, fetchCategories } from "@/lib/services/categoryService";
import type { CategoryData } from "@/types/category";
import { postQueryKeys } from "./post";

export const categoryQueryKeys = { all: ["categories"] as const };

export function useCategoriesQuery(enabled = true, initialData?: CategoryData[]) {
  return useQuery({
    queryKey: categoryQueryKeys.all,
    queryFn: fetchCategories,
    enabled,
    initialData,
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await addCategory(name);
      if (!result.success) throw new Error(result.error || "카테고리 추가 중 오류가 발생했습니다.");
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategory(id);
      if (!result.success) throw new Error(result.error || "삭제 중 오류가 발생했습니다.");
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),
      ]);
    },
  });
}
