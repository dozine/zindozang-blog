import type { Meta, StoryObj } from "@storybook/react";
import { SessionProvider } from "next-auth/react";
import { Category } from "@prisma/client";
import CategoryListClient from "@/components/categoryList/CategoryListClient";

const mockCategories: Category[] = [
  {
    id: "1",
    slug: "tech",
    title: "Technology",
    img: null,
  },
  {
    id: "2",
    slug: "lifestyle",
    title: "Lifestyle",
    img: null,
  },
  {
    id: "3",
    slug: "travel",
    title: "Travel",
    img: null,
  },
  {
    id: "4",
    slug: "food",
    title: "Food",
    img: null,
  },
  {
    id: "5",
    slug: "uncategorized",
    title: "Uncategorized",
    img: null,
  },
];

const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
    image: "/avatar.png",
  },
  expires: "2025-12-31",
};

const meta = {
  title: "Components/CategoryList/CategoryList",
  component: CategoryListClient,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  argTypes: {
    initialCategories: {
      description: "초기 카테고리 목록",
      control: "object",
    },
  },
} satisfies Meta<typeof CategoryListClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialCategories: mockCategories,
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export const Authenticated: Story = {
  args: {
    initialCategories: mockCategories,
  },
  decorators: [
    (Story) => (
      <SessionProvider session={mockSession}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialCategories: [
      {
        id: "uncategorized",
        slug: "uncategorized",
        title: "Uncategorized",
        img: null,
      },
    ],
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};

export const SingleCategory: Story = {
  args: {
    initialCategories: [
      mockCategories[0],
      {
        id: "uncategorized",
        slug: "uncategorized",
        title: "Uncategorized",
        img: null,
      },
    ],
  },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
};
