import SinglePage from "@/app/(blog)/posts/[slug]/page";
import { getPostData } from "@/lib/data/post";
import type { PostDetailView } from "@/types/post";

jest.mock("@/lib/data/post", () => ({ getPostData: jest.fn() }));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/app/(blog)/posts/[slug]/singlePageClient", () => ({
  __esModule: true,
  default: () => null,
}));

test("한글 URL로 상세 화면에 접근해도 삭제와 수정에 DB의 실제 slug를 전달한다", async () => {
  const slug = "test-랑께";
  jest.mocked(getPostData).mockResolvedValue({ slug } as PostDetailView);
  const page = await SinglePage({ params: Promise.resolve({ slug: encodeURIComponent(slug) }) });
  expect(getPostData).toHaveBeenCalledWith(encodeURIComponent(slug));
  expect(page.props.slug).toBe(slug);
});
