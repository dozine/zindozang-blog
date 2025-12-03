"use client";
import { useState, useCallback } from "react";
import { useModal } from "@/hooks/useModal"; // 기존 useModal 훅 재사용

export function useTagActions(onTagDelete: (tagId: string) => void) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleSuccessDelete = useCallback(
    (tagId: string) => {
      if (onTagDelete) {
        onTagDelete(tagId);
      }

      closeDeleteModal();
      setMenuOpen(false);

      alert("태그가 성공적으로 삭제되었습니다.");
    },
    [onTagDelete, closeDeleteModal]
  );

  return {
    menuOpen,
    toggleMenu,
    isDeleteModalOpen,
    openDeleteModal,
    handleSuccessDelete,
    closeDeleteModal,
  };
}
