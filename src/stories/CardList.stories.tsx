import Card from "@/components/card/Card";
import Pagination from "@/components/pagination/Pagination";
import type { Meta, StoryObj } from "@storybook/react";
import {
  mockPostDefault,
  mockPostLongDesc,
  mockPostNoImage,
} from "./mock/postData";

const CardListStory = ({
  posts,
  count,
  page,
}: {
  posts: any[];
  count: number;
  page: number;
}) => {
  const POSTS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(count / POSTS_PER_PAGE));

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}></h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {posts.length > 0 ? (
          posts.map((item, index) => (
            <div key={item.id}>
              <Card item={item} priority={index < 3} />
            </div>
          ))
        ) : (
          <p>POST가 없습니다.</p>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
};

const meta: Meta<typeof CardListStory> = {
  title: "Components/Card/CardList",
  component: CardListStory,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CardListStory>;

export const Default: Story = {
  args: {
    page: 1,
    posts: [
      mockPostDefault,
      mockPostNoImage,
      mockPostLongDesc,
      {
        ...mockPostDefault,
        id: "post_4",
        slug: "post-4",
        title: "네 번째 포스트",
      },
      {
        ...mockPostDefault,
        id: "post_5",
        slug: "post-5",
        title: "다섯 번째 포스트",
      },
    ],
    count: 5,
  },
};

// 단일 포스트
export const SinglePost: Story = {
  name: "단일 포스트",
  args: {
    page: 1,
    posts: [mockPostDefault],
    count: 1,
  },
};

// 포스트 없음
export const NoPosts: Story = {
  name: "포스트 없음",
  args: {
    page: 1,
    posts: [],
    count: 0,
  },
};

// 이미지 없는 포스트들
export const WithoutImages: Story = {
  name: "이미지 없는 포스트들",
  args: {
    page: 1,
    posts: [
      mockPostNoImage,
      {
        ...mockPostNoImage,
        id: "post_6",
        slug: "no-img-2",
        title: "이미지 없는 포스트 2",
      },
      {
        ...mockPostNoImage,
        id: "post_7",
        slug: "no-img-3",
        title: "이미지 없는 포스트 3",
      },
    ],
    count: 3,
  },
};

// 긴 설명 포스트들
export const WithLongDescriptions: Story = {
  name: "긴 설명 포스트들",
  args: {
    page: 1,
    posts: [
      mockPostLongDesc,
      {
        ...mockPostLongDesc,
        id: "post_8",
        slug: "long-2",
        title: "긴 설명 테스트 2",
      },
    ],
    count: 2,
  },
};

// 페이지네이션 테스트 - 많은 포스트
export const WithPagination: Story = {
  name: "페이지네이션 테스트 (많은 포스트)",
  args: {
    page: 2,
    posts: Array.from({ length: 10 }, (_, i) => ({
      ...mockPostDefault,
      id: `post_${i + 11}`,
      slug: `post-${i + 11}`,
      title: `포스트 ${i + 11}`,
    })),
    count: 50,
  },
};

export const WithCategory: Story = {
  name: "카테고리 필터링",
  args: {
    page: 1,
    posts: [mockPostDefault, mockPostLongDesc],
    count: 2,
  },
  parameters: {
    docs: {
      description: {
        story: '카테고리 "Coding"으로 필터링된 결과',
      },
    },
  },
};

export const WithTags: Story = {
  name: "태그 필터링",
  args: {
    page: 1,
    posts: [mockPostDefault],
    count: 1,
  },
  parameters: {
    docs: {
      description: {
        story: "React, NextJS 태그로 필터링된 결과",
      },
    },
  },
};

// 많은 포스트 (스크롤 테스트)
export const ManyPosts: Story = {
  name: "스크롤 테스트",
  args: {
    page: 1,
    posts: Array.from({ length: 10 }, (_, i) => ({
      ...mockPostDefault,
      id: `post_${i + 1}`,
      slug: `post-${i + 1}`,
      title: `포스트 제목 ${i + 1}`,
      desc: i % 2 === 0 ? mockPostLongDesc.desc : mockPostDefault.desc,
      img: i % 3 === 0 ? [] : mockPostDefault.img,
    })),
    count: 100,
  },
};
