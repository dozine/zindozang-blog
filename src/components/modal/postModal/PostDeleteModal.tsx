"use client";
import React from "react";
import Modal from "../Modal";
import { usePostDeleteModal } from "@/hooks/post/useDeletePostModal";

const PostDeleteModal = ({ isOpen, onClose, onDelete }) => {
  const { isLoading, error, handleDeleteConfirm } = usePostDeleteModal({
    onDelete,
    onClose,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>정말 이 포스트를 삭제하시겠습니까?</h3>
      <p>이 작업은 되돌릴 수 없습니다.</p>
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>오류: {error}</p>
      )}

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={handleDeleteConfirm}
          disabled={isLoading}
          style={{
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "삭제 중..." : "삭제"}
        </button>
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            backgroundColor: "#e0e0e0",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};

export default PostDeleteModal;
