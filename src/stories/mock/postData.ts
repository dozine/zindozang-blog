import { FormattedPostResponse } from "@/types";

export const mockUser = {
  email: "test@example.com",
  name: "테스트 작성자",
  id: "user_1",
  image: "https://placehold.co/100x100/007AFF/FFFFFF?text=User",
};

const mockTags = [
  { id: "t1", name: "React" },
  { id: "t2", name: "NextJS" },
];

export const mockPostDefault: FormattedPostResponse = {
  id: "post_1",
  createdAt: new Date("2023-10-26"),
  slug: "storybook-guide",
  title: "Storybook 컴포넌트 문서화 핵심 가이드",
  desc: "## Storybook은 왜 필요한가?\n\nStorybook은 컴포넌트를 독립적으로 개발하고 시각적으로 테스트하는 환경을 제공합니다. 이는 개발 과정에서 재사용성과 일관성을 극대화합니다.",
  img: ["https://placehold.co/600x400/007AFF/FFFFFF?text=Cover+Image"],
  views: 120,
  catSlug: "Coding",
  userEmail: mockUser.email,
  isPublished: true,
  user: mockUser,
  tags: mockTags,
};

export const mockPostNoImage: FormattedPostResponse = {
  ...mockPostDefault,
  id: "post_2",
  slug: "no-image-test",
  title: "이미지가 없는 포스트 레이아웃 테스트",
  img: [],
};

// 3. 긴 설명 포스트 (줄임표 테스트)
export const mockPostLongDesc: FormattedPostResponse = {
  ...mockPostDefault,
  id: "post_3",
  slug: "long-description-test",
  title: "긴 설명 테스트: 60자 이상일 때 줄임표(Truncation) 확인",
  desc: "이것은 60자가 넘는 아주 긴 포스트 설명입니다. 컴포넌트가 이 긴 텍스트를 받아서 정상적으로 60자에서 자르고, 끝에 '...' 줄임표를 붙여주는지 확인하기 위한 시나리오입니다. 우리의 Card 컴포넌트가 이 상황을 우아하게 처리하는지 봅시다. 이것은 60자가 넘는 아주 긴 포스트 설명입니다.",
  tags: mockTags.slice(0, 1),
};
