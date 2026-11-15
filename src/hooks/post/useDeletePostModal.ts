"use client";

import { getErrorMessage } from "@/lib/utils/error";
import { useDeletePost } from "@/queries/post";
import { useCallback, useEffect } from "react";

interface UsePostDeleteModalProps {
  slug: string;
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function usePostDeleteModal({ slug, isOpen, onSuccess, onClose }: UsePostDeleteModalProps) {
  const { mutateAsync: deletePost, isPending, isError, error, reset } = useDeletePost();

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deletePost(slug);
    } catch {
      return;
    }
    alert("삭제되었습니다.");
    onSuccess();
    onClose();
  }, [deletePost, slug, onSuccess, onClose]);

  return {
    isLoading: isPending,
    error: isError ? getErrorMessage(error, "삭제 중 오류가 발생했습니다.") : null,
    handleDeleteConfirm,
  };
}
