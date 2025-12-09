import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import Modal from "../components/modal/Modal";
import { Category } from "@prisma/client";

const fn = (...args: any[]) => console.log("Action triggered (Storybook Mock)", args);

const mockCategories: Category[] = [
  {
    id: "cat_1",
    slug: "coding",
    title: "코딩",
    img: null,
  },
  {
    id: "cat_2",
    slug: "design",
    title: "디자인",
    img: null,
  },
  {
    id: "cat_3",
    slug: "business",
    title: "비즈니스",
    img: null,
  },
  {
    id: "cat_uncategorized",
    slug: "uncategorized",
    title: "미분류",
    img: null,
  },
];

type DeleteCategoryModalStoryArgs = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  categories: Category[];
  mockIsLoading: boolean;
  mockError: string | null;
  initialOpen: boolean;
};

const TestableCategoryDeleteModal = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  mockIsLoading = false,
  mockError = null,
}: DeleteCategoryModalStoryArgs & {
  mockIsLoading?: boolean;
  mockError?: string | null;
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCategoryId || mockIsLoading) return;

    if (!mockError) {
      await onSuccess();
      onClose();
      setSelectedCategoryId("");
    }
  };

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
        disabled={mockIsLoading}
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

      {mockError && (
        <p
          style={{
            color: "red",
            margin: "0.5rem 0 1rem",
            fontSize: "0.875rem",
          }}
        >
          {mockError}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={handleDeleteSubmit}
          disabled={!selectedCategoryId || mockIsLoading}
          style={{
            cursor: !selectedCategoryId || mockIsLoading ? "not-allowed" : "pointer",
          }}
        >
          {mockIsLoading ? "처리중..." : "삭제"}
        </button>
        <button onClick={onClose}>취소</button>
      </div>
    </Modal>
  );
};

const InteractiveDeleteCategoryModalWrapper = (args: DeleteCategoryModalStoryArgs) => {
  const [isOpen, setIsOpen] = useState(args.initialOpen || false);
  const [categories] = useState<Category[]>(args.categories);

  const { mockIsLoading, mockError, onSuccess, onClose } = args;

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div
        style={{
          padding: "20px",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center",
          alignItems: "center",
          border: "1px dashed #ccc",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          현재 카테고리 수: {categories.filter((c) => c.slug !== "uncategorized").length}개
        </p>
        <button
          onClick={handleOpen}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "4px",
            backgroundColor: "#EF4444",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          카테고리 삭제 모달 열기
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

      <TestableCategoryDeleteModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={onSuccess}
        categories={categories}
        mockIsLoading={mockIsLoading}
        mockError={mockError}
        initialOpen={args.initialOpen}
      />
    </>
  );
};

const meta: Meta<DeleteCategoryModalStoryArgs> = {
  title: "Components/Modal/Category/DeleteCategoryModal",
  component: TestableCategoryDeleteModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    categories: mockCategories,
    onClose: fn,
    onSuccess: async () => fn("카테고리 삭제 성공"),
    mockIsLoading: false,
    mockError: null,
    initialOpen: false,
    isOpen: false,
  },
};

export default meta;

type Story = StoryObj<DeleteCategoryModalStoryArgs>;

export const DefaultState: Story = {
  name: "기본 상태 (삭제 가능)",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    initialOpen: true,
  },
};

export const LoadingState: Story = {
  name: "로딩 중 상태 (버튼 비활성화)",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: true,
    mockError: null,
    initialOpen: true,
  },
};

export const ErrorState: Story = {
  name: "오류 발생 상태 (메시지 확인)",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "서버 연결에 실패하여 카테고리를 삭제할 수 없습니다.",
    initialOpen: true,
  },
};

export const ManyCategories: Story = {
  name: "많은 카테고리 (10개)",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    categories: [
      ...mockCategories,
      {
        id: "cat_5",
        slug: "tech",
        title: "기술",
        img: null,
      },
      {
        id: "cat_6",
        slug: "lifestyle",
        title: "라이프스타일",
        img: null,
      },
      {
        id: "cat_7",
        slug: "travel",
        title: "여행",
        img: null,
      },
      {
        id: "cat_8",
        slug: "food",
        title: "음식",
        img: null,
      },
      {
        id: "cat_9",
        slug: "health",
        title: "건강",
        img: null,
      },
      {
        id: "cat_10",
        slug: "education",
        title: "교육",
        img: null,
      },
    ],
    initialOpen: true,
  },
};

export const SingleCategory: Story = {
  name: "카테고리 1개 (uncategorized 제외)",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    categories: [
      mockCategories[0],
      mockCategories[3], // uncategorized (필터링됨)
    ],
    initialOpen: true,
  },
};

export const NoCategories: Story = {
  name: " 삭제 가능한 카테고리 없음",
  render: (args) => <InteractiveDeleteCategoryModalWrapper {...args} />,
  args: {
    categories: [mockCategories[3]], // uncategorized만
    initialOpen: true,
  },
};
