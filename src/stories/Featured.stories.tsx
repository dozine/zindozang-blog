import type { Meta, StoryObj } from "@storybook/react";
import { Featuredost } from "@/types";
import Featured from "@/components/featured/Featured";

const mockPosts: Featuredost[] = [
  {
    id: 1,
    title: "블로그 소개글",
    desc: "안녕하세요. 프론트엔드 개발자 장도진입니다. 이 글은 블로그의 메인 소개 글입니다.",
    image: "/zindozang.png",
  },
  {
    id: 2,
    title: "리액트 Hooks 완전 정복",
    desc: "React Hooks의 핵심 개념과 주요 사용법을 깊이 있게 다룹니다. useState, useEffect 등.",
    image:
      "https://via.placeholder.com/1200x500/007bff/ffffff?text=React+Hooks",
  },
  {
    id: 3,
    title: "CSS Grid를 활용한 레이아웃",
    desc: "Flexbox와는 다른 강력한 CSS Grid 시스템을 이해하고 실무에 적용하는 방법을 배웁니다.",
    image:
      "https://via.placeholder.com/1200x500/28a745/ffffff?text=CSS+Grid+Layout",
  },
];

const meta: Meta<typeof Featured> = {
  title: "Components/Featured/Featured",
  component: Featured,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Featured>;

export const SingleFeatured: Story = {
  args: {
    posts: [mockPosts[0]],
  },
  parameters: {
    docs: {
      description: {
        story: "추천 게시물이 하나일 때의 컴포넌트 동작을 테스트합니다.",
      },
    },
  },
};

export const MultiplePosts: Story = {
  args: {
    posts: mockPosts,
  },
  parameters: {
    docs: {
      description: {
        story:
          "여러 개의 추천 게시물이 있을 때 슬라이더의 동작을 테스트합니다.",
      },
    },
  },
};
