import Modal from "@/components/modal/Modal";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState, ChangeEvent } from "react";

const fn = (...args: unknown[]) => console.log("Action triggered (Storybook Mock)", args);

type AddCategoryModalStoryArgs = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  mockIsLoading: boolean;
  mockError: string | null;
  initialOpen: boolean;
};

const TestableAddCategoryModal = ({
  isOpen,
  onClose,
  onSuccess,
  mockIsLoading = false,
  mockError = null,
}: AddCategoryModalStoryArgs & {
  mockIsLoading?: boolean;
  mockError?: string | null;
}) => {
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    if (title.trim() === "" || mockIsLoading) return;

    if (!mockError) {
      await onSuccess();
      onClose();
      setTitle("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>카테고리 추가</h3>

      <input
        type="text"
        placeholder="카테고리 이름"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        disabled={mockIsLoading}
      />
      {mockError && <p style={{ color: "red", fontSize: "0.875rem" }}>{mockError}</p>}

      <button onClick={handleSubmit} disabled={mockIsLoading || title.trim() === ""}>
        {mockIsLoading ? "처리 중" : "추가"}
      </button>
    </Modal>
  );
};

const InteractiveAddCategoryModalWrapper = (args: AddCategoryModalStoryArgs) => {
  const [isOpen, setIsOpen] = useState(args.initialOpen || false);

  const { mockIsLoading, mockError, onSuccess, onClose } = args;

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
            backgroundColor: "#10B981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          카테고리 추가 모달 열기
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

      <TestableAddCategoryModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={onSuccess}
        mockIsLoading={mockIsLoading}
        mockError={mockError}
        initialOpen={args.initialOpen}
      />
    </>
  );
};

const meta: Meta<AddCategoryModalStoryArgs> = {
  title: "Components/Modal/Category/AddCategoryModal",
  component: TestableAddCategoryModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onSuccess: async () => fn("카테고리 추가 성공"),
    onClose: fn,
    mockIsLoading: false,
    mockError: null,
    initialOpen: false,
    isOpen: false,
  },
};

export default meta;

type Story = StoryObj<AddCategoryModalStoryArgs>;

export const DefaultState: Story = {
  name: "기본 상태 (입력 가능)",
  render: (args) => <InteractiveAddCategoryModalWrapper {...args} />,
  args: {
    initialOpen: true,
  },
};

export const LoadingState: Story = {
  name: "로딩 중 상태 (입력/버튼 비활성화)",
  render: (args) => <InteractiveAddCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: true,
    mockError: null,
    initialOpen: true,
  },
};

export const ErrorState: Story = {
  name: "오류 발생 상태 (메시지 확인)",
  render: (args) => <InteractiveAddCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "이미 존재하는 카테고리 이름입니다.",
    initialOpen: true,
  },
};

export const DuplicateError: Story = {
  name: "중복 카테고리 에러",
  render: (args) => <InteractiveAddCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "해당 카테고리는 이미 존재합니다. 다른 이름을 사용해주세요.",
    initialOpen: true,
  },
};

export const ServerError: Story = {
  name: "서버 연결 에러",
  render: (args) => <InteractiveAddCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
    initialOpen: true,
  },
};

export const Closed: Story = {
  name: "닫힌 상태 (isOpen=false)",
  args: {
    isOpen: false,
    initialOpen: false,
  },
  render: (args) => (
    <div style={{ padding: "20px", fontSize: "1rem", color: "#1f2937" }}>
      <p>모달이 닫힌 상태입니다. `isOpen`이 `false`로 설정되어 모달이 보이지 않습니다.</p>
      <TestableAddCategoryModal {...args} />
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const EmptyInput: Story = {
  name: "빈 입력 상태 (버튼 비활성화)",
  render: (args) => (
    <div style={{ padding: "20px" }}>
      <p style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
        ℹ️ 입력 필드가 비어있을 때 추가 버튼이 비활성화되는지 확인하세요.
      </p>
      <InteractiveAddCategoryModalWrapper {...args} />
    </div>
  ),
  args: {
    initialOpen: true,
  },
};

export const LongCategoryName: Story = {
  name: "긴 카테고리 이름 입력 테스트",
  render: (args) => (
    <div style={{ padding: "20px" }}>
      <p style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
        ℹ️ 매우 긴 카테고리 이름을 입력했을 때 UI가 어떻게 보이는지 확인하세요.
        <br />
        예: 이것은 매우 긴 카테고리 이름 테스트입니다 UI가 잘 처리하는지 확인해주세요.
      </p>
      <InteractiveAddCategoryModalWrapper {...args} />
    </div>
  ),
  args: {
    initialOpen: true,
  },
};
