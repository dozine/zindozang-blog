import type { PostFieldsResponse } from "./post";

/** POST /api/tags 요청 본문. */
export interface CreateTagRequest {
  name: string;
}

/** GET /api/tags/[id], DELETE /api/tags/[id]의 경로 파라미터. */
export interface TagByIdRequest {
  id: string;
}

export interface TagResponse {
  id: string;
  name: string;
}

export interface TagWithPostCountResponse extends TagResponse {
  _count: { posts: number };
}

export type TagListResponse = TagWithPostCountResponse[];
export type CreateTagResponse = TagResponse;

/** 상세 조회에 포함되는 연결 정보와 공개 게시글. */
export interface TagDetailResponse extends TagResponse {
  posts: {
    id: string;
    postId: string;
    tagId: string;
    post: PostFieldsResponse;
  }[];
}

export interface DeleteTagResponse {
  message: string;
}

/** 중복 409 응답은 기존 태그 또는 오류 메시지가 될 수 있다. */
export interface TagErrorResponse {
  message: string;
}

export type DuplicateTagResponse = TagResponse | TagErrorResponse;
