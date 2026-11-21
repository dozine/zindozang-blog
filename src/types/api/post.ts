import type { z } from "zod";
import type {
  createPostSchema,
  updatePostSchema,
  postSlugSchema,
  postListResponseSchema,
  deletePostResponseSchema,
  postFieldsResponseSchema,
  postAuthorResponseSchema,
  postResponseSchema,
} from "@/lib/zod/post";

/** POST /api/posts 요청 본문. 태그는 ID 배열이다. */
export type CreatePostRequest = z.infer<typeof createPostSchema>;

/** PUT /api/posts/[slug] 요청 본문. */
export type UpdatePostRequest = z.infer<typeof updatePostSchema>;

/** 게시글 필드의 HTTP 응답 계약. 날짜는 ISO 문자열이다. */
export type PostFieldsResponse = z.infer<typeof postFieldsResponseSchema>;
export type PostAuthorResponse = z.infer<typeof postAuthorResponseSchema>;
export type PostResponse = z.infer<typeof postResponseSchema>;

/** 목록 API는 작성자의 공개 필드만 반환한다. */
export type PostListResponse = z.infer<typeof postListResponseSchema>;

export type PostDetailResponse = PostResponse;

export type CreatePostResponse = PostDetailResponse;
export type UpdatePostResponse = PostResponse;

export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;

/** GET, PUT, DELETE /api/posts/[slug]의 경로 파라미터. */
export type PostSlugRequest = z.infer<typeof postSlugSchema>;
