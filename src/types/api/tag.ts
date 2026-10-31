import type { TagData, TagWithPostCount, TagWithPosts } from "@/types/tag";

/** POST /api/tags 요청 본문. */
export interface CreateTagRequest {
  name: string;
}

/** GET /api/tags/[id], DELETE /api/tags/[id]의 경로 파라미터. */
export interface TagByIdRequest {
  id: string;
}

export type TagResponse = TagData;
export type TagListResponse = TagWithPostCount[];
export type CreateTagResponse = TagResponse;

/** 상세 조회에서 연결된 게시글의 날짜는 JSON 문자열이다. */
type TagPostData = TagWithPosts["posts"][number];
export type TagDetailResponse = Omit<TagWithPosts, "posts"> & {
  posts: (Omit<TagPostData, "post"> & {
    post: Omit<TagPostData["post"], "createdAt"> & { createdAt: string };
  })[];
};

export interface DeleteTagResponse {
  message: string;
}

/** 중복 409 응답은 기존 태그 또는 오류 메시지가 될 수 있다. */
export interface TagErrorResponse {
  message: string;
}

export type DuplicateTagResponse = TagResponse | TagErrorResponse;
