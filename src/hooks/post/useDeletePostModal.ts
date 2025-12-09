"use client";
import { useState, useCallback } from "react";

interface UsePostDeleteModalProps {
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function usePostDeleteModal({ onDelete, onClose }: UsePostDeleteModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteConfirm = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      console.error("포스트 삭제 오류:", err);
      setError(err.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, onClose]);

  return {
    isLoading,
    error,
    handleDeleteConfirm,
  };
}
