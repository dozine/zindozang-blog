import type { TagResponse } from "./tag";

/** POST /api/posts 요청 본문. 태그는 ID 배열이다. */
export interface CreatePostRequest {
  slug: string;
  title: string;
  desc: string;
  img?: string | string[] | null;
  catSlug?: string | null;
  isPublished?: boolean;
  tags?: string[];
}

/** PUT /api/posts/[slug] 요청 본문. */
export interface UpdatePostRequest {
  title: string;
  desc: string;
  img?: string | string[] | null;
  catSlug?: string | null;
  tags?: string[];
  isPublished?: boolean;
}

/** 게시글 필드의 HTTP 응답 계약. 날짜는 ISO 문자열이다. */
export interface PostFieldsResponse {
  id: string;
  createdAt: string;
  slug: string;
  title: string;
  desc: string;
  img: string[];
  views: number;
  isPublished: boolean;
  catSlug: string | null;
}

export interface PostAuthorResponse {
  id: string;
  name: string | null;
  image: string | null;
}

export interface PostResponse extends PostFieldsResponse {
  tags: TagResponse[];
  user: PostAuthorResponse;
}

/** 목록 API는 작성자의 공개 필드만 반환한다. */
export interface PostListResponse {
  posts: PostResponse[];
  count: number;
}

export type PostDetailResponse = PostResponse;

export type CreatePostResponse = PostDetailResponse;
export type UpdatePostResponse = PostResponse;

export interface DeletePostResponse {
  message: string;
}
