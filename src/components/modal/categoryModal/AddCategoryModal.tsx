"use client";
import React, { ChangeEvent } from "react";
import { useAddCategoryModal } from "@/hooks/category/useAddCategoryModal";
import Modal from "../Modal";

const AddCategoryModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) => {
  const { title, setTitle, isLoading, error, handleSubmit } =
    useAddCategoryModal({
      onSuccess,
      onClose,
      isOpen,
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>카테고리 추가</h3>

      <input
        type="text"
        placeholder="카테고리 이름"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setTitle(e.target.value)
        }
        style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        disabled={isLoading}
      />
      {error && <p style={{ color: "red", fontSize: "0.875rem" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isLoading || title.trim() === ""}
      >
        {isLoading ? "처리 중" : "추가"}
      </button>
    </Modal>
  );
};

export default AddCategoryModal;
