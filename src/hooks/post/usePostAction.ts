import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function usePostActions(slug: string) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal(false);

  const handleEdit = () => {
    router.push(`/write?edit=true&slug=${slug}`);
  };

  return {
    menuOpen,
    setMenuOpen,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleEdit,
    toggleMenu: () => setMenuOpen((prev) => !prev),
  };
}
