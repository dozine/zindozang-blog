"use client";

import { getErrorMessage } from "@/lib/utils/error";
import { useState, useEffect, useCallback } from "react";
import type { CategoryData } from "@/types/category";
import { fetchCategories } from "@/lib/services/categoryService";

interface UseFetchCategoriesResult {
  categories: CategoryData[];
  error: string | null;
  isLoading: boolean;
  refreshCategories: () => Promise<void>; // 수동 리프레시 함수 제공
}

export function useFetchCategories(initialCategories: CategoryData[]): UseFetchCategoriesResult {
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialCategories || initialCategories.length === 0
  );

  const refreshCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(getErrorMessage(err, "카테고리 로딩 중 문제가 발생했습니다"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      refreshCategories();
    } else {
      setIsLoading(false);
    }
  }, [initialCategories, refreshCategories]);

  return { categories, error, isLoading, refreshCategories };
}
