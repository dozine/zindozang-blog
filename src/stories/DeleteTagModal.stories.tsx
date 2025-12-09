import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import Modal from "../components/modal/Modal";
import { TagWithPostCount } from "@/types/tag";

const fn = (...args: any[]) =>
  console.log("Action triggered (Storybook Mock)", args);

const mockTags: TagWithPostCount[] = [
  {
    id: "tag_1",
    name: "React",

    _count: {
      posts: 15,
    },
  },
  {
    id: "tag_2",
    name: "NextJS",

    _count: {
      posts: 8,
    },
  },
  {
    id: "tag_3",
    name: "TypeScript",

    _count: {
      posts: 23,
    },
  },
  {
    id: "tag_4",
    name: "JavaScript",

    _count: {
      posts: 0,
    },
  },
  {
    id: "tag_5",
    name: "CSS",

    _count: {
      posts: 5,
    },
  },
];

type DeleteTagModalStoryArgs = {
  isOpen: boolean;
  onClose: () => void;
  onSuccessDelete: (deletedTagId: string) => void;
  tags: TagWithPostCount[];
  mockIsLoading: boolean;
  mockError: string | null;
  initialOpen: boolean;
};

const TestableDeleteTagModal = ({
  isOpen,
  onClose,
  onSuccessDelete,
  tags,
  mockIsLoading = false,
  mockError = null,
}: DeleteTagModalStoryArgs & {
  mockIsLoading?: boolean;
  mockError?: string | null;
}) => {
  const [selectedTagId, setSelectedTagId] = useState("");

  const handleTagSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTagId(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedTagId || mockIsLoading) return;

    if (!mockError) {
      onSuccessDelete(selectedTagId);
      onClose();
      setSelectedTagId("");
    }
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
        disabled={mockIsLoading}
      >
        <option value="">선택해주세요</option>
        {tags?.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name} ({tag._count?.posts ?? 0})
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
          onClick={handleSubmit}
          disabled={!selectedTagId || mockIsLoading}
          style={{
            cursor: !selectedTagId || mockIsLoading ? "not-allowed" : "pointer",
            padding: "8px 16px",
            background: "#e53e3e",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {mockIsLoading ? "처리중..." : "삭제"}
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

const InteractiveDeleteTagModalWrapper = (args: DeleteTagModalStoryArgs) => {
  const [isOpen, setIsOpen] = useState(args.initialOpen || false);
  const [tags] = useState<TagWithPostCount[]>(args.tags);

  const { mockIsLoading, mockError, onSuccessDelete, onClose } = args;

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleSuccessDelete = (deletedTagId: string) => {
    onSuccessDelete(deletedTagId);
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
          현재 태그 수: {tags.length}개 | 총 포스트 수:{" "}
          {tags.reduce((sum, tag) => sum + (tag._count?.posts ?? 0), 0)}개
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
          태그 삭제 모달 열기
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

      <TestableDeleteTagModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccessDelete={handleSuccessDelete}
        tags={tags}
        mockIsLoading={mockIsLoading}
        mockError={mockError}
        initialOpen={args.initialOpen}
      />
    </>
  );
};

const meta: Meta<DeleteTagModalStoryArgs> = {
  title: "Components/Modal/Tag/DeleteTagModal",
  component: TestableDeleteTagModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    tags: mockTags,
    onClose: fn,
    onSuccessDelete: (deletedTagId: string) =>
      fn("태그 삭제 성공", deletedTagId),
    mockIsLoading: false,
    mockError: null,
    initialOpen: false,
    isOpen: false,
  },
};

export default meta;

type Story = StoryObj<DeleteTagModalStoryArgs>;

export const DefaultState: Story = {
  name: "기본 상태 (삭제 가능)",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    initialOpen: true,
  },
};

export const LoadingState: Story = {
  name: "로딩 중 상태 (버튼 비활성화)",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    mockIsLoading: true,
    mockError: null,
    initialOpen: true,
  },
};

export const ErrorState: Story = {
  name: "오류 발생 상태 (메시지 확인)",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    mockIsLoading: false,
    mockError: "서버 연결에 실패하여 태그를 삭제할 수 없습니다.",
    initialOpen: true,
  },
};

export const TagWithManyPosts: Story = {
  name: "포스트가 많은 태그 (경고 필요)",
  render: (args) => (
    <div style={{ padding: "20px" }}>
      <p style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
        ℹ️ TypeScript 태그는 23개의 포스트를 가지고 있습니다.
        <br />
        실제 시스템에서는 이런 태그 삭제 시 경고가 필요할 수 있습니다.
      </p>
      <InteractiveDeleteTagModalWrapper {...args} />
    </div>
  ),
  args: {
    initialOpen: true,
  },
};

export const TagsWithNoPosts: Story = {
  name: " 포스트가 없는 태그들",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    tags: [
      {
        id: "tag_10",
        name: "Unused1",

        _count: { posts: 0 },
      },
      {
        id: "tag_11",
        name: "Unused2",

        _count: { posts: 0 },
      },
      {
        id: "tag_12",
        name: "Unused3",

        _count: { posts: 0 },
      },
    ],
    initialOpen: true,
  },
};

export const ManyTags: Story = {
  name: " 많은 태그 (20개)",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    tags: [
      ...mockTags,
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `tag_${i + 6}`,
        name: `Tag ${i + 6}`,
        slug: `tag-${i + 6}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { posts: Math.floor(Math.random() * 20) },
      })),
    ],
    initialOpen: true,
  },
};

export const SingleTag: Story = {
  name: "태그 1개만",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    tags: [mockTags[0]],
    initialOpen: true,
  },
};

export const NoTags: Story = {
  name: "태그 없음 (빈 목록)",
  render: (args) => <InteractiveDeleteTagModalWrapper {...args} />,
  args: {
    tags: [],
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
      <p>
        모달이 닫힌 상태입니다. `isOpen`이 `false`로 설정되어 모달이 보이지
        않습니다.
      </p>
      <TestableDeleteTagModal {...args} />
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};
