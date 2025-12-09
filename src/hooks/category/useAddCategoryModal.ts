"use client";
import { useState, useEffect, useCallback } from "react";
import { addCategory } from "@/lib/services/categoryService";

interface UseAddCategoryModalProps {
  onSuccess: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function useAddCategoryModal({ onSuccess, onClose, isOpen }: UseAddCategoryModalProps) {
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      setError("카테고리 이름을 입력해주세요.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const result = await addCategory(trimmedTitle);

      if (result.success) {
        await onSuccess();
        setTitle("");
        onClose();
      } else {
        setError(result.error || "카테고리 추가 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "카테고리 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [title, onSuccess, onClose]);

  return {
    title,
    setTitle,
    isLoading,
    error,
    handleSubmit,
  };
}
