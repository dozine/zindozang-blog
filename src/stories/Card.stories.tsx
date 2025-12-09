import type { Meta, StoryObj } from "@storybook/react";
import Card from "../components/card/Card";
import { mockPostDefault, mockPostNoImage, mockPostLongDesc } from "@/stories/mock/postData";

const meta: Meta<typeof Card> = {
  title: "Components/Card/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    item: mockPostDefault,
    priority: false,
    index: 0,
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const DefaultCard: Story = {
  name: "기본 포스트 카드",
  args: {
    item: mockPostDefault,
  },
};

export const NoImage: Story = {
  name: "이미지가 없을 때",
  args: {
    item: mockPostNoImage,
  },
};

export const LongDescription: Story = {
  name: "긴 설명",
  args: {
    item: mockPostLongDesc,
  },
};

export const PriorityCard: Story = {
  name: "목록 첫 번째 요소 (Priority=true)",
  args: {
    item: { ...mockPostDefault, title: "LCP 최적화 대상 포스트" },
    index: 0,
  },
};
