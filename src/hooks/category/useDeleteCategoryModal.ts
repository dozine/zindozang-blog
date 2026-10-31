"use client";
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import type { CategoryData } from "@/types/category";
import { deleteCategory } from "@/lib/services/categoryService";

interface UseDeleteCategoryModalProps {
  onSuccess: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  categories: CategoryData[];
}

export function useDeleteCategoryModal({
  onSuccess,
  onClose,
  isOpen,
  categories,
}: UseDeleteCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId("");
      setError(null);
    }
  }, [isOpen]);

  const handleCategorySelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setError(null);
  }, []);

  const handleDeleteSubmit = useCallback(async (): Promise<void> => {
    if (!selectedCategoryId) {
      setError("삭제할 카테고리를 선택해주세요.");
      return;
    }

    const selectedCategory = categories?.find((cat) => cat.id === selectedCategoryId);

    if (selectedCategory?.slug === "uncategorized") {
      setError("'미분류' 카테고리는 삭제할 수 없습니다.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      // 💡 서비스 함수 호출
      const result = await deleteCategory(selectedCategoryId);

      if (result.success === false) {
        setError(result.error || "삭제 중 오류가 발생했습니다.");
      } else {
        await onSuccess(); // 부모 컴포넌트의 리프레시 함수 호출
        setSelectedCategoryId("");
        onClose();
      }
    } catch (err: any) {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, categories, onSuccess, onClose]);

  return {
    selectedCategoryId,
    isLoading,
    error,
    handleCategorySelectChange,
    handleDeleteSubmit,
  };
}
