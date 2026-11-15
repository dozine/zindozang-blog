"use client";
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useDeleteCategory } from "@/queries/category";
import { getErrorMessage } from "@/lib/utils/error";

interface UseDeleteCategoryModalProps {
  onSuccess: () => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function useDeleteCategoryModal({
  onSuccess,
  onClose,
  isOpen,
}: UseDeleteCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { mutateAsync: deleteCategory, isPending, isError, error, reset } = useDeleteCategory();

  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId("");
      setLocalError(null);
      reset();
    }
  }, [isOpen, reset]);

  const handleCategorySelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setSelectedCategoryId(e.target.value);
      setLocalError(null);
      reset();
    },
    [reset]
  );

  const handleDeleteSubmit = useCallback(async (): Promise<void> => {
    if (!selectedCategoryId) {
      setLocalError("삭제할 카테고리를 선택해주세요.");
      return;
    }
    setLocalError(null);
    try {
      await deleteCategory(selectedCategoryId);
    } catch {
      return;
    }
    try {
      await onSuccess();
      setSelectedCategoryId("");
      onClose();
    } catch (err) {
      setLocalError(getErrorMessage(err, "삭제 후 화면을 갱신할 수 없습니다."));
    }
  }, [selectedCategoryId, onSuccess, onClose, deleteCategory]);

  return {
    selectedCategoryId,
    isLoading: isPending,
    error: localError || (isError ? getErrorMessage(error, "삭제 중 오류가 발생했습니다.") : null),
    handleCategorySelectChange,
    handleDeleteSubmit,
  };
}
