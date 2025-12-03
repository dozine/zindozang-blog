// src/hooks/useModal.ts

import { useState, useCallback } from "react";

/**
 * 모달의 열림/닫힘 상태를 관리하는 커스텀 훅입니다.
 * @returns [isOpen, openModal, closeModal, toggleModal]
 */
export function useModal(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  // 모달을 여는 함수 (useCallback으로 최적화)
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  // 모달을 닫는 함수 (useCallback으로 최적화)
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 모달 상태를 토글하는 함수
  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
