"use client";
import { useState, useEffect, useCallback } from "react";
import { Category } from "@prisma/client";
import { getAllCategories } from "@/lib/data/category";

interface UseFetchCategoriesResult {
  categories: Category[];
  error: string | null;
  isLoading: boolean;
  refreshCategories: () => Promise<void>; // 수동 리프레시 함수 제공
}

export function useFetchCategories(initialCategories: Category[]): UseFetchCategoriesResult {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialCategories || initialCategories.length === 0
  );

  const refreshCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllCategories(); // 서버 함수를 클라이언트에서 호출 (API 라우트 사용)
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "카테고리 로딩 중 문제가 발생했습니다");
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
