"use client";
import React from "react";
import Modal from "../Modal";
import { TagWithPostCount } from "@/types/tag"; // 적절한 태그 타입 import
import { useDeleteTagModal } from "@/hooks/tag/useDeleteTagModal";

interface DeleteTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessDelete: (deletedTagId: string) => void;
  tags: TagWithPostCount[];
}

const DeleteTagModal = ({
  isOpen,
  onClose,
  onSuccessDelete,
  tags,
}: DeleteTagModalProps) => {
  const {
    selectedTagId,
    isLoading,
    error,

    handleTagSelectChange,
    handleDeleteSubmit,
  } = useDeleteTagModal(isOpen, onClose);

  const handleSubmit = () => {
    handleDeleteSubmit(onSuccessDelete);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>🗑️ 삭제할 태그를 선택해주세요</h3>
      <select
        value={selectedTagId}
        onChange={handleTagSelectChange}
        style={{
          width: "100%",
          marginTop: "1rem",
          padding: "8px",
          marginBottom: "1rem",
        }}
        disabled={isLoading}
      >
        <option value="">선택해주세요</option>
        {tags?.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name} ({tag._count?.posts ?? 0})
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
          onClick={handleSubmit}
          disabled={!selectedTagId || isLoading}
          style={{
            cursor: !selectedTagId || isLoading ? "not-allowed" : "pointer",
            padding: "8px 16px",
            background: "#e53e3e",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {isLoading ? "처리중..." : "삭제"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            background: "#ccc",
            border: "none",
            borderRadius: "4px",
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};

export default DeleteTagModal;
