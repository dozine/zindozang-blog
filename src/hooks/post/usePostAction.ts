// src/hooks/usePostActions.ts

// ... (다른 import 유지)
import { useModal } from "@/hooks/useModal"; // 새로 만든 훅 import
import { deletePost } from "@/lib/services/postService";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function usePostActions(slug: string, onSuccess: () => void) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // 💡 useModal 훅 사용으로 isDeleteModalOpen과 setIsDeleteModalOpen 대체
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal(false);

  // 수정 버튼 핸들러
  const handleEdit = () => {
    router.push(`/write?edit=true&slug=${slug}`);
  };

  // 삭제 실행 핸들러
  const handleDelete = async () => {
    try {
      await deletePost(slug);
      alert("삭제되었습니다.");
      closeDeleteModal(); // 모달 닫기
      onSuccess();
    } catch (err) {
      console.error("삭제 오류", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      // 실패하든 성공하든 모달 닫기
      closeDeleteModal();
    }
  };

  return {
    menuOpen,
    setMenuOpen,
    // 💡 변경된 모달 상태 및 함수 반환
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleEdit,
    handleDelete,
    toggleMenu: () => setMenuOpen((prev) => !prev),
  };
}
