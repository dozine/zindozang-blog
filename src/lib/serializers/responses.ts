import type { Category, Post, Tag } from "@prisma/client";
import type { PostData, PostView } from "@/types/post";
import type { TagWithPosts } from "@/types/tag";
import type { CategoryResponse } from "@/types/api/category";
import type { PostDetailResponse, PostFieldsResponse, PostResponse } from "@/types/api/post";
import type { TagDetailResponse, TagResponse, TagWithPostCountResponse } from "@/types/api/tag";

export function toCategoryResponse(category: Category): CategoryResponse {
  return { id: category.id, slug: category.slug, title: category.title, img: category.img };
}

export function toTagResponse(tag: Tag): TagResponse {
  return { id: tag.id, name: tag.name };
}

export function toTagWithPostCountResponse(
  tag: Tag & { _count: { posts: number } }
): TagWithPostCountResponse {
  return { ...toTagResponse(tag), _count: { posts: tag._count.posts } };
}

export function toPostFieldsResponse(post: Post): PostFieldsResponse {
  return {
    id: post.id,
    createdAt: post.createdAt.toISOString(),
    slug: post.slug,
    title: post.title,
    desc: post.desc,
    img: post.img,
    views: post.views,
    isPublished: post.isPublished,
    catSlug: post.catSlug,
    userEmail: post.userEmail,
  };
}

export function toPostResponse(post: PostData): PostResponse {
  return {
    ...toPostFieldsResponse(post),
    tags: post.tags.map(toTagResponse),
    user: {
      id: post.user.id,
      email: post.user.email,
      name: post.user.name,
      image: post.user.image,
    },
  };
}

/** 서버 렌더링은 Date를 유지하되 화면에 필요한 필드만 전달한다. */
export function toPostView(post: PostData): PostView {
  return { ...toPostResponse(post), createdAt: post.createdAt };
}

export function toPostDetailResponse(
  post: PostData & { user: { emailVerified: Date | null } }
): PostDetailResponse {
  const response = toPostResponse(post);
  return {
    ...response,
    user: { ...response.user, emailVerified: post.user.emailVerified?.toISOString() ?? null },
  };
}

export function toTagDetailResponse(tag: TagWithPosts): TagDetailResponse {
  return {
    ...toTagResponse(tag),
    posts: tag.posts.map((relation) => ({
      id: relation.id,
      postId: relation.postId,
      tagId: relation.tagId,
      post: toPostFieldsResponse(relation.post),
    })),
  };
}
