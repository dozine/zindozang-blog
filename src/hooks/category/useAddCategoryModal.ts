"use client";

import { getErrorMessage } from "@/lib/utils/error";
import { useState, useEffect, useCallback } from "react";
import { useAddCategory } from "@/queries/category";

interface UseAddCategoryModalProps {
  onSuccess: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function useAddCategoryModal({ onSuccess, onClose, isOpen }: UseAddCategoryModalProps) {
  const [title, setTitle] = useState<string>("");
  const { mutateAsync: addCategory, isPending, isError, error, reset } = useAddCategory();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setLocalError(null);
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      setLocalError("카테고리 이름을 입력해주세요.");
      return;
    }
    setLocalError(null);

    try {
      await addCategory(trimmedTitle);
    } catch {
      return;
    }
    try {
      await onSuccess();
      setTitle("");
      onClose();
    } catch (err) {
      setLocalError(getErrorMessage(err, "카테고리 추가 후 화면을 갱신할 수 없습니다."));
    }
  }, [title, onSuccess, onClose, addCategory]);

  return {
    title,
    setTitle,
    isLoading: isPending,
    error:
      localError ||
      (isError ? getErrorMessage(error, "카테고리 추가 중 오류가 발생했습니다.") : null),
    handleSubmit,
  };
}
