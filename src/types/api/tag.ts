import type { z } from "zod";
import type {
  createTagSchema,
  tagByIdSchema,
  deleteTagResponseSchema,
  tagErrorResponseSchema,
  duplicateTagResponseSchema,
  tagResponseSchema,
  tagWithPostCountResponseSchema,
  tagListResponseSchema,
} from "@/lib/zod/tag";
import type { tagDetailResponseSchema } from "@/lib/zod/tagDetail";

/** POST /api/tags 요청 본문. */
export type CreateTagRequest = z.infer<typeof createTagSchema>;

/** GET /api/tags/[id], DELETE /api/tags/[id]의 경로 파라미터. */
export type TagByIdRequest = z.infer<typeof tagByIdSchema>;

export type TagResponse = z.infer<typeof tagResponseSchema>;
export type TagWithPostCountResponse = z.infer<typeof tagWithPostCountResponseSchema>;
export type TagListResponse = z.infer<typeof tagListResponseSchema>;
export type CreateTagResponse = TagResponse;

/** 상세 조회에 포함되는 연결 정보와 공개 게시글. */
export type TagDetailResponse = z.infer<typeof tagDetailResponseSchema>;
export type DeleteTagResponse = z.infer<typeof deleteTagResponseSchema>;

/** 중복 409 응답은 기존 태그 또는 오류 메시지가 될 수 있다. */
export type TagErrorResponse = z.infer<typeof tagErrorResponseSchema>;
export type DuplicateTagResponse = z.infer<typeof duplicateTagResponseSchema>;
