import type { TagResponse } from "./tag";

/** POST /api/posts 요청 본문. 태그는 ID 배열이다. */
export interface CreatePostRequest {
  slug: string;
  title: string;
  desc: string;
  img?: string | string[] | null;
  catSlug?: string;
  isPublished?: boolean;
  tags?: string[];
}

/** PUT /api/posts/[slug] 요청 본문. */
export interface UpdatePostRequest {
  title: string;
  desc: string;
  img?: string | string[] | null;
  catSlug?: string;
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
  catSlug: string;
  userEmail: string;
}

export interface PostAuthorResponse {
  id: string;
  email: string;
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

/** 상세 조회 및 생성 API는 작성자의 emailVerified도 반환한다. */
export type PostDetailResponse = Omit<PostResponse, "user"> & {
  user: PostResponse["user"] & { emailVerified: string | null };
};

export type CreatePostResponse = PostDetailResponse;
export type UpdatePostResponse = PostResponse;

export interface DeletePostResponse {
  message: string;
}
