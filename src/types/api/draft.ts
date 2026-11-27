import type { z } from "zod";
import type {
  draftContentSchema,
  draftResponseSchema,
  draftListResponseSchema,
  draftIdSchema,
  saveDraftSchema,
  publishDraftSchema,
  deleteDraftSchema,
  deleteDraftResponseSchema,
} from "@/lib/zod/draft";
import type { PostResponse } from "./post";

/** 초안으로 보관하는 작성 내용과 게시 설정. */
export type DraftContent = z.infer<typeof draftContentSchema>;
/** 초안 HTTP 응답. updatedAt은 ISO 문자열 또는 null이다. */
export type DraftResponse = z.infer<typeof draftResponseSchema>;
export type DraftListResponse = z.infer<typeof draftListResponseSchema>;
export type DraftDetailResponse = DraftResponse;
/** /api/drafts/[id]의 경로 파라미터. */
export type DraftIdRequest = z.infer<typeof draftIdSchema>;
/** POST /api/drafts 요청·응답. */
export type SaveDraftRequest = z.infer<typeof saveDraftSchema>;
export type SaveDraftResponse = DraftResponse;
/** POST /api/drafts/[id]/publish 요청·응답. */
export type PublishDraftRequest = z.infer<typeof publishDraftSchema>;
export type PublishDraftResponse = PostResponse;
/** DELETE /api/drafts/[id] 요청 본문과 응답. */
export type DeleteDraftRequest = z.infer<typeof deleteDraftSchema>;
export type DeleteDraftResponse = z.infer<typeof deleteDraftResponseSchema>;
/** 서비스·mutation에 전달하는 경로 파라미터와 요청 본문. */
export type DeleteDraftInput = DraftIdRequest & DeleteDraftRequest;
export type PublishDraftInput = DraftIdRequest & { body: PublishDraftRequest };
