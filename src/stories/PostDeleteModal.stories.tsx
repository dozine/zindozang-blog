import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import Modal from "../components/modal/Modal";

const fn = (...args: any[]) =>
  console.log("Action triggered (Storybook Mock)", args);

type PostDeleteModalStoryArgs = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  mockIsLoading: boolean;
  mockError: string | null;
  initialOpen: boolean;
};

const TestablePostDeleteModal = ({
  isOpen,
  onClose,
  onDelete,
  mockIsLoading = false,
  mockError = null,
}: PostDeleteModalStoryArgs & {
  mockIsLoading?: boolean;
  mockError?: string | null;
}) => {
  const handleDeleteConfirm = () => {
    if (!mockIsLoading && !mockError) {
      onDelete();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>정말 이 포스트를 삭제하시겠습니까?</h3>
      <p>이 작업은 되돌릴 수 없습니다.</p>
      {mockError && (
        <p style={{ color: "red", marginTop: "10px" }}>오류: {mockError}</p>
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
          disabled={mockIsLoading}
          style={{
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: mockIsLoading ? "not-allowed" : "pointer",
          }}
        >
          {mockIsLoading ? "삭제 중..." : "삭제"}
        </button>
        <button
          onClick={onClose}
          disabled={mockIsLoading}
          style={{
            backgroundColor: "#e0e0e0",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: mockIsLoading ? "not-allowed" : "pointer",
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};

const InteractivePostDeleteModalWrapper = (args: PostDeleteModalStoryArgs) => {
  const [isOpen, setIsOpen] = useState(args.initialOpen || false);

  const { mockIsLoading, mockError, onDelete, onClose } = args;

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <>
      <div
        style={{
          padding: "20px",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          border: "1px dashed #ccc",
          gap: "10px",
        }}
      >
        <button
          onClick={handleOpen}
          style={{
            padding: "10px 20px",
            backgroundColor: "#FF6666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          삭제 모달 열기
        </button>

        <div
          style={{
            fontSize: "12px",
            color: "#666",
            textAlign: "center",
            padding: "8px 12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          {mockIsLoading && "📝 Mock 상태: 로딩 중..."}
          {mockError && `📝 Mock 상태: 에러 발생`}
          {!mockIsLoading && !mockError && "📝 Mock 상태: 정상"}
        </div>
      </div>

      <TestablePostDeleteModal
        isOpen={isOpen}
        onClose={handleClose}
        onDelete={onDelete}
        mockIsLoading={mockIsLoading}
        mockError={mockError}
        initialOpen={args.initialOpen}
      />
    </>
  );
};

const meta: Meta<PostDeleteModalStoryArgs> = {
  title: "Components/Modal/Post/PostDeleteModal",
  component: TestablePostDeleteModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onDelete: fn,
    onClose: fn,
    mockIsLoading: false,
    mockError: null,
    initialOpen: false,
    isOpen: false,
  },
};

export default meta;

type Story = StoryObj<PostDeleteModalStoryArgs>;

export const DefaultState: Story = {
  name: "1. 기본 상태 (삭제 가능)",
  render: (args) => <InteractivePostDeleteModalWrapper {...args} />,
  args: {
    initialOpen: true,
  },
};

export const LoadingState: Story = {
  name: "2. 로딩 중 상태 (버튼 비활성화)",
  render: (args) => <InteractivePostDeleteModalWrapper {...args} />,
  args: {
    mockIsLoading: true,
    mockError: null,
    initialOpen: true,
  },
};

export const ErrorState: Story = {
  name: "3. 오류 발생 상태 (메시지 확인)",
  render: (args) => <InteractivePostDeleteModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "서버 연결에 실패하여 포스트를 삭제할 수 없습니다.",
    initialOpen: true,
  },
};
