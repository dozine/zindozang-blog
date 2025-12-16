import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TagList from "@/components/tagList/TagList";
import { SessionProvider } from "next-auth/react";
import { mockTagswithCounts } from "./mock/tagData";

const meta: Meta<typeof TagList> = {
  title: "Components/TagList/TagList",
  component: TagList,
  tags: ["autodocs"],
  argTypes: {
    tags: {
      control: "object",
      description: "표시할 태그 목록 (id, name, _count.posts 포함)",
    },
    selectedTags: {
      control: "object",
      description: "현재 선택된 태그 이름 목록",
      defaultValue: [],
    },
    onTagClick: {
      action: "tagClicked",
      description: "태그 클릭 시 호출되는 함수",
    },
    onTagDelete: {
      action: "tagDeleted",
      description: "태그 삭제 성공 시 호출되는 함수",
    },
  },
  parameters: {
    backgrounds: {
      default: "light",
      values: [{ name: "light", value: "#f0f0f0" }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagList>;

export const Default: Story = {
  args: {
    tags: mockTagswithCounts,
    selectedTags: [],
    onTagClick: { action: "onTagClick" } as any,
    onTagDelete: { action: "onTagDelete" } as any,
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export const WithSelectedTags: Story = {
  args: {
    ...Default.args,
    selectedTags: ["React", "CSS"],
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export const AuthenticatedUser: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <SessionProvider
        session={{ user: { name: "Test User" }, expires: "2025-12-31" }}
      >
        <div style={{ padding: "20px" }}>
          <Story />
        </div>
      </SessionProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "인증된 사용자(Authenticated) 상태를 시뮬레이션합니다. **태그 관리** 버튼이 표시됩니다. 버튼 클릭 시 `useTagActions`에 의해 메뉴 및 모달이 작동합니다. (단, 모달 컴포넌트는 Mock입니다.)",
      },
    },
  },
};

export const EmptyList: Story = {
  args: {
    ...Default.args,
    tags: [],
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};
