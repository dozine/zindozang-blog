"use client";
import React from "react";
import Modal from "../Modal";
import { Category } from "@prisma/client";
import { useDeleteCategoryModal } from "@/hooks/category/useDeleteCategoryModal";

const DeleteCategoryModal = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  categories: Category[];
}) => {
  const {
    selectedCategoryId,
    isLoading,
    error,
    handleCategorySelectChange,
    handleDeleteSubmit,
  } = useDeleteCategoryModal({ onSuccess, onClose, isOpen, categories });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>삭제할 카테고리를 선택해주세요</h3>
      <select
        value={selectedCategoryId}
        onChange={handleCategorySelectChange}
        style={{
          width: "100%",
          marginTop: "1rem",
          padding: "8px",
          marginBottom: "1rem",
        }}
        disabled={isLoading}
      >
        <option value="">선택해주세요</option>
        {categories
          ?.filter((cat) => cat.slug !== "uncategorized")
          .map((category: Category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
      </select>

      {error && (
        <p
          style={{
            color: "red",
            margin: "0.5rem 0 1rem",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={handleDeleteSubmit} // 💡 훅 핸들러 사용
          disabled={!selectedCategoryId || isLoading}
          style={{
            cursor:
              !selectedCategoryId || isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "처리중..." : "삭제"}
        </button>
        <button onClick={onClose}>취소</button>
      </div>
    </Modal>
  );
};

export default DeleteCategoryModal;
