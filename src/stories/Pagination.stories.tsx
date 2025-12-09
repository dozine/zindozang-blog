import Pagination from "@/components/pagination/Pagination";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ padding: "40px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const FirstPage: Story = {
  name: "첫 페이지 (1/10)",
  args: {
    page: 1,
    totalPages: 10,
  },
};

export const MiddlePage: Story = {
  name: "중간 페이지 (5/10)",
  args: {
    page: 5,
    totalPages: 10,
  },
};

export const LastPage: Story = {
  name: "마지막 페이지 (10/10)",
  args: {
    page: 10,
    totalPages: 10,
  },
};

export const FewPages: Story = {
  name: "적은 페이지 (3/5)",
  args: {
    page: 3,
    totalPages: 5,
  },
};

export const SinglePage: Story = {
  name: "단일 페이지 (1/1)",
  args: {
    page: 1,
    totalPages: 1,
  },
};

export const TwoPages: Story = {
  name: "두 페이지 (1/2)",
  args: {
    page: 1,
    totalPages: 2,
  },
};

export const EarlyPage: Story = {
  name: "초반부 페이지 (2/20)",
  args: {
    page: 2,
    totalPages: 20,
  },
};

export const LatePage: Story = {
  name: "후반부 페이지 (18/20)",
  args: {
    page: 18,
    totalPages: 20,
  },
};

export const ManyPagesMiddle: Story = {
  name: "많은 페이지 중간 (50/100)",
  args: {
    page: 50,
    totalPages: 100,
  },
};

export const PageThree: Story = {
  name: "3페이지 (경계 케이스 - 말줄임표 시작)",
  args: {
    page: 3,
    totalPages: 10,
  },
};

export const PageFour: Story = {
  name: "4페이지 (경계 케이스)",
  args: {
    page: 4,
    totalPages: 10,
  },
};

export const PageEightOfTen: Story = {
  name: "8페이지 (경계 케이스 - 말줄임표 끝)",
  args: {
    page: 8,
    totalPages: 10,
  },
};

export const DarkMode: Story = {
  name: "다크 모드",
  args: {
    page: 5,
    totalPages: 10,
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{
          backgroundColor: "#1a1a1a",
          padding: "40px",
          minHeight: "100px",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  name: "모바일 뷰",
  args: {
    page: 5,
    totalPages: 10,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
